
import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../constants';
import { useAppStore } from '../store/useAppStore';

export const useWebRTC = () => {
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [simulatedVideoUrl, setSimulatedVideoUrl] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'idle' | 'matching' | 'connecting' | 'connected'>('idle');
  const [iceState, setIceState] = useState<string>('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const { user } = useAppStore();

  // Initialize Socket
  useEffect(() => {
    socketRef.current = io(APP_CONFIG.SIGNALLING_URL);
    
    socketRef.current.on('match-found', async ({ roomId, isInitiator, partner }) => {
      console.log('[WebRTC] Match Found!', roomId, isInitiator);
      roomIdRef.current = roomId;
      setPartnerData(partner);
      setConnectionState('connecting');
      
      // Crucial: Wait a small moment to ensure localStreamRef is populated if just started
      await createPeerConnection(roomId, isInitiator);
    });

    socketRef.current.on('signal', async (data) => {
      if (!peerConnection.current) {
        console.warn('[WebRTC] Signal received but no PeerConnection exists yet.');
        return;
      }
      
      try {
        if (data.signal.type === 'offer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socketRef.current?.emit('signal', { roomId: data.roomId, signal: peerConnection.current.localDescription });
        } else if (data.signal.type === 'answer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.signal.candidate || data.signal));
        }
      } catch (e) {
        console.error('[WebRTC] Signaling Error:', e);
      }
    });

    socketRef.current.on('partner-disconnected', () => {
      console.log('[WebRTC] Partner disconnected');
      cleanup();
      setConnectionState('matching');
      startMatchmaking();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createPeerConnection = async (roomId: string, isInitiator: boolean) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    const pc = new RTCPeerConnection({ 
      iceServers: APP_CONFIG.ICE_SERVERS,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle'
    });
    
    peerConnection.current = pc;
    setIceState(pc.iceConnectionState);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', { roomId, signal: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received Remote Track');
      setRemoteStreamState(event.streams[0]);
      setConnectionState('connected');
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      setIceState(state);
      console.log('[WebRTC] ICE State Changed:', state);
      
      if (state === 'connected' || state === 'completed') {
        setConnectionState('connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        // Only trigger rematching if we were previously connected
        if (connectionState === 'connected' || connectionState === 'connecting') {
           cleanup();
           setConnectionState('matching');
           startMatchmaking();
        }
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', { roomId, signal: pc.localDescription });
      } catch (e) {
        console.error('[WebRTC] Offer Creation Error:', e);
      }
    }

    return pc;
  };

  const startLocalStream = useCallback(async (video: boolean = true) => {
    if (localStreamRef.current) return localStreamRef.current;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false,
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStreamState(stream);
      return stream;
    } catch (err) {
      console.error("[WebRTC] Error accessing media devices:", err);
      return null;
    }
  }, []);

  const startMatchmaking = useCallback(() => {
    setConnectionState('matching');
    socketRef.current?.emit('join-matchmaking', {
      interests: user.interests,
      gender: user.gender
    });
  }, [user.interests, user.gender]);

  const startSimulation = useCallback((videoUrl: string) => {
    setSimulatedVideoUrl(videoUrl);
    setConnectionState('connected');
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (roomIdRef.current) {
      socketRef.current?.emit('leave-match', roomIdRef.current);
      roomIdRef.current = null;
    }
    setRemoteStreamState(null);
    setSimulatedVideoUrl(null);
    setPartnerData(null);
    setConnectionState('idle');
    setIceState('new');
  }, []);

  const stopTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStreamState(null);
      setIsMuted(false);
      setIsVideoOff(false);
    }
    cleanup();
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    simulatedVideoUrl,
    connectionState,
    iceState,
    isMuted,
    isVideoOff,
    partnerData,
    socket: socketRef.current,
    roomId: roomIdRef.current,
    setConnectionState,
    startLocalStream,
    startMatchmaking,
    startSimulation,
    stopTracks,
    cleanup,
    toggleAudio,
    toggleVideo,
  };
};
