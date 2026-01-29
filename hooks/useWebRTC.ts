
import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../constants';
import { useAppStore } from '../store/useAppStore';

export const useWebRTC = () => {
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [simulatedVideoUrl, setSimulatedVideoUrl] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'idle' | 'matching' | 'connecting' | 'connected'>('idle');
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
      console.log('Match Found!', roomId, isInitiator);
      roomIdRef.current = roomId;
      setPartnerData(partner);
      setConnectionState('connecting');
      
      if (isInitiator) {
        await createPeerConnection(roomId, true);
      }
    });

    socketRef.current.on('signal', async (data) => {
      if (!peerConnection.current) {
        await createPeerConnection(data.roomId, false);
      }
      
      if (data.signal.type === 'offer') {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer!);
        socketRef.current?.emit('signal', { roomId: data.roomId, signal: peerConnection.current?.localDescription });
      } else if (data.signal.type === 'answer') {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        try {
          await peerConnection.current?.addIceCandidate(new RTCIceCandidate(data.signal));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    socketRef.current.on('partner-disconnected', () => {
      cleanup();
      setConnectionState('matching');
      // Re-join matchmaking automatically
      startMatchmaking();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createPeerConnection = async (roomId: string, isInitiator: boolean) => {
    // Correctly using the updated ICE_SERVERS list
    const pc = new RTCPeerConnection({ 
      iceServers: APP_CONFIG.ICE_SERVERS,
      iceTransportPolicy: 'all' // Ensure we try both direct and relay connections
    });
    peerConnection.current = pc;

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
      console.log('Received Remote Track');
      setRemoteStreamState(event.streams[0]);
      setConnectionState('connected');
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanup();
        setConnectionState('matching');
        startMatchmaking();
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('signal', { roomId, signal: pc.localDescription });
    }

    return pc;
  };

  const startLocalStream = useCallback(async (video: boolean = true) => {
    if (localStreamRef.current) return localStreamRef.current;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStreamState(stream);
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
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
