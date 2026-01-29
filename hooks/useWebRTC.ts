
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
  const signalQueue = useRef<any[]>([]);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const { user } = useAppStore();

  const processSignal = useCallback(async (data: any) => {
    if (!peerConnection.current) return;

    try {
      if (data.signal.type === 'offer') {
        console.log('[WebRTC] Processing Offer');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socketRef.current?.emit('signal', { roomId: data.roomId, signal: peerConnection.current.localDescription });
        
        // Process any candidates that arrived while waiting for the offer
        while (pendingCandidates.current.length > 0) {
          const cand = pendingCandidates.current.shift();
          if (cand) await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand));
        }
      } else if (data.signal.type === 'answer') {
        console.log('[WebRTC] Processing Answer');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        
        // Process any candidates that arrived while waiting for the answer
        while (pendingCandidates.current.length > 0) {
          const cand = pendingCandidates.current.shift();
          if (cand) await peerConnection.current.addIceCandidate(new RTCIceCandidate(cand));
        }
      } else if (data.signal.candidate) {
        if (peerConnection.current.remoteDescription) {
          console.log('[WebRTC] Adding ICE Candidate');
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        } else {
          console.log('[WebRTC] Queuing ICE Candidate (no remote desc)');
          pendingCandidates.current.push(data.signal.candidate);
        }
      }
    } catch (e) {
      console.error('[WebRTC] Signal Processing Error:', e);
    }
  }, []);

  // Initialize Socket
  useEffect(() => {
    socketRef.current = io(APP_CONFIG.SIGNALLING_URL);
    
    socketRef.current.on('match-found', async ({ roomId, isInitiator, partner }) => {
      console.log('[WebRTC] Match Found!', roomId, isInitiator);
      roomIdRef.current = roomId;
      setPartnerData(partner);
      setConnectionState('connecting');
      
      await createPeerConnection(roomId, isInitiator);
    });

    socketRef.current.on('signal', async (data) => {
      if (!peerConnection.current) {
        console.debug('[WebRTC] Signal received but no PeerConnection yet. Queuing.');
        signalQueue.current.push(data);
        return;
      }
      await processSignal(data);
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
  }, [processSignal]);

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

    // Add local tracks BEFORE creating offer
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
      console.log('[WebRTC] Received Remote Track', event.streams[0]);
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
        if (connectionState === 'connected' || connectionState === 'connecting') {
           cleanup();
           setConnectionState('matching');
           startMatchmaking();
        }
      }
    };

    // Process queued signals now that PC exists
    while (signalQueue.current.length > 0) {
      const queued = signalQueue.current.shift();
      await processSignal(queued);
    }

    if (isInitiator) {
      try {
        console.log('[WebRTC] Creating Offer');
        const offer = await pc.createOffer({
           offerToReceiveAudio: true,
           offerToReceiveVideo: true
        });
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
    signalQueue.current = [];
    pendingCandidates.current = [];
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
