
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoContainer } from './VideoContainer';
import { ChatOverlay } from './ChatOverlay';
import { ChatMode, Message } from '../types';
import { Icons, APP_CONFIG, UI_TEXT, THEMES } from '../constants';
import { captureAndUploadScreenshot } from '../services/screenshotService';
import { ThemeSwitcher } from './ThemeSwitcher';

export const ChatSession: React.FC = () => {
  const { 
    user, 
    selectedMode, 
    setMode, 
    safetyScreenshotsEnabled, 
    devMode, 
    setDevMode, 
    onlineCount, 
    currentTheme,
    screenshotIntervalMin,
    screenshotIntervalMax
  } = useAppStore();

  const { 
    localStream, 
    remoteStream,
    simulatedVideoUrl,
    startLocalStream, 
    stopTracks, 
    setConnectionState, 
    connectionState,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    startMatchmaking,
    startSimulation,
    cleanup,
    socket,
    roomId,
    partnerData
  } = useWebRTC();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [strangerName, setStrangerName] = useState<string>('Stranger');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [logoClicks, setLogoClicks] = useState(0);
  
  const themeData = THEMES[currentTheme];
  const primaryColorClass = `text-${themeData.primary}`;
  const primaryBgClass = `bg-${themeData.primary}`;
  const textColorClass = themeData.isLight ? 'text-neutral-900' : 'text-white';
  const primaryGlowShadow = themeData.isLight ? '' : `shadow-[0_0_12px_${themeData.glow}]`;

  // Use a ref for the timer to ensure stability across re-renders
  const captureTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', (data: { text: string }) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'stranger',
          text: data.text,
          timestamp: Date.now()
        }]);
      });

      socket.on('typing', (data: { isTyping: boolean }) => {
        setIsTyping(data.isTyping);
      });
    }
  }, [socket]);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    if (newClicks >= 10) {
      setDevMode(!devMode);
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
      setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  useEffect(() => {
    if (connectionState === 'connected') {
      const id = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      setCurrentSessionId(id);
      console.debug(`[ChatSession] Match connected. Assigned Monitoring ID: ${id}`);
    } else {
      setCurrentSessionId('');
    }
  }, [connectionState]);

  // STABLE CAPTURE LOOP
  useEffect(() => {
    const isReady = connectionState === 'connected' && currentSessionId && safetyScreenshotsEnabled;
    
    if (!isReady) {
      if (captureTimerRef.current) {
        window.clearTimeout(captureTimerRef.current);
        captureTimerRef.current = null;
      }
      return;
    }

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * (screenshotIntervalMax - screenshotIntervalMin + 1)) + screenshotIntervalMin;
      
      captureTimerRef.current = window.setTimeout(async () => {
        // Double check state before capturing
        if (safetyScreenshotsEnabled && connectionState === 'connected') {
          await captureAndUploadScreenshot(currentSessionId);
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (captureTimerRef.current) {
        window.clearTimeout(captureTimerRef.current);
      }
    };
  }, [connectionState, currentSessionId, safetyScreenshotsEnabled, screenshotIntervalMin, screenshotIntervalMax]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (selectedMode === ChatMode.VIDEO) {
        await startLocalStream();
      }
      if (!active) return;
      startMatchmaking();
    };
    init();
    return () => { active = false; };
  }, [selectedMode, startLocalStream, startMatchmaking]);

  useEffect(() => {
    return () => { stopTracks(); };
  }, [stopTracks]);

  const handleSendMessage = (text: string) => {
    if (simulatedVideoUrl) {
      const newMsg: Message = { id: Date.now().toString(), sender: 'me', text, timestamp: Date.now() };
      setMessages(prev => [...prev, newMsg]);
      
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender: 'stranger',
            text: `(Simulation) That sounds interesting!`,
            timestamp: Date.now()
          }]);
        }, 1500);
      }, 800);
      return;
    }

    if (!socket || !roomId) return;
    
    const newMsg: Message = { id: Date.now().toString(), sender: 'me', text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    
    socket.emit('chat-message', { roomId, text });
  };

  const handleSimulateMatch = () => {
    if (!APP_CONFIG.ALLOW_SIMULATION) return;
    const randomPersona = APP_CONFIG.SIMULATION_LIBRARY[Math.floor(Math.random() * APP_CONFIG.SIMULATION_LIBRARY.length)];
    setStrangerName(randomPersona.name + " (Sim)");
    startSimulation(randomPersona.videoUrl);
    setMessages([{ id: 'sys-start', sender: 'system', text: `Matched with ${randomPersona.name} (Simulation).`, timestamp: Date.now() }]);
  };

  const handleNext = () => {
    cleanup();
    setMessages([]);
    setStrangerName('Stranger');
    startMatchmaking();
  };

  const handleEnd = () => {
    setMode(null);
    stopTracks();
  };

  return (
    <div className="h-screen flex flex-col p-4 md:p-6 overflow-hidden transition-all duration-700" style={{ backgroundColor: themeData.bg }}>
      <div className="flex-none flex items-center justify-between mb-4 px-2 h-12">
        <div className="flex items-center gap-3">
          <button onClick={handleLogoClick} className={`text-xl font-black tracking-tighter active:scale-95 font-space-grotesk ${textColorClass}`}>
            <span>{UI_TEXT.common.siteNamePrefix}</span>
            <span className={primaryColorClass}>{UI_TEXT.common.siteNameSuffix}</span>
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-inner ${themeData.isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-white/5'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${primaryBgClass} animate-pulse ${primaryGlowShadow}`} />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              {onlineCount} {UI_TEXT.common.onlineCount}
            </span>
          </div>

          {(connectionState === 'matching' || connectionState === 'connecting') && (
            <div className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse ${themeData.isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-white/10'} ${primaryColorClass}`}>
              {UI_TEXT.chat.findingPartner}
            </div>
          )}

          {devMode && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border animate-in fade-in zoom-in duration-300 ${themeData.isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-white/10'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${safetyScreenshotsEnabled ? primaryBgClass : 'bg-neutral-600'}`} />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                DEV: {safetyScreenshotsEnabled ? UI_TEXT.dev.activeIndicator : UI_TEXT.dev.disabledIndicator}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button onClick={handleEnd} className={`p-2 rounded-lg transition-all ${themeData.isLight ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900' : 'hover:bg-neutral-800 text-neutral-500 hover:text-white'}`}>
            <Icons.X />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 overflow-hidden">
        <div className={`lg:col-span-3 flex flex-col gap-4 relative min-h-0 ${selectedMode === ChatMode.TEXT ? 'hidden lg:flex' : ''}`}>
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <VideoContainer stream={remoteStream} videoUrl={simulatedVideoUrl} label={strangerName} isRemote />
            <VideoContainer stream={localStream} label="You" muted isVideoOff={isVideoOff} />
          </div>

          {(connectionState === 'matching' || connectionState === 'connecting') && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl ${themeData.isLight ? 'bg-white/60' : 'bg-black/60'}`}>
              <div className={`flex flex-col items-center gap-6 p-8 glass rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 ${themeData.isLight ? 'border-neutral-200 bg-white/80' : 'border-white/10'}`}>
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full border-4 border-t-transparent animate-spin`} style={{ borderTopColor: themeData.primaryHex, borderColor: themeData.isLight ? '#e5e5e5' : 'rgba(255,255,255,0.05)' }} />
                  <div className={`absolute inset-0 flex items-center justify-center ${textColorClass}`}>
                    <Icons.Video />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className={`text-2xl font-black mb-2 uppercase tracking-tighter ${textColorClass}`}>{UI_TEXT.chat.matchingTitle}</h3>
                  <p className="text-neutral-500 text-sm">{UI_TEXT.chat.matchingDesc}</p>
                </div>
                {devMode && (
                  <button 
                    onClick={handleSimulateMatch}
                    className={`mt-4 px-6 py-2 rounded-full border transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] ${themeData.isLight ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-white/10'}`}
                  >
                    Simulate Match (Admin Tool)
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-none flex items-center justify-center gap-4 py-2 h-20">
            <div className={`flex items-center gap-2 px-2 rounded-2xl border h-full ${themeData.isLight ? 'bg-neutral-100/80 border-neutral-200' : 'bg-neutral-900/50 border-white/5'}`}>
              <button onClick={toggleAudio} className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:text-white dark:hover:bg-white/5'}`}>
                <Icons.Settings />
              </button>
              <button onClick={toggleVideo} className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:text-white dark:hover:bg-white/5'}`}>
                <Icons.Video />
              </button>
            </div>
            <button 
              onClick={handleNext} 
              className={`flex-1 max-w-[300px] h-full flex items-center justify-center gap-3 px-10 rounded-2xl font-black text-xl transition-all active:scale-[0.98] shadow-lg uppercase tracking-tighter ${
                themeData.isLight 
                  ? 'bg-neutral-900 text-white shadow-neutral-200 hover:bg-black' 
                  : 'bg-white text-black shadow-white/5 hover:opacity-90'
              }`}
            >
              <Icons.Skip />
              {UI_TEXT.common.next}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-1 min-h-0 flex flex-col ${selectedMode === ChatMode.TEXT ? 'col-span-1' : ''}`}>
          <ChatOverlay messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
        </div>
      </div>
    </div>
  );
};
