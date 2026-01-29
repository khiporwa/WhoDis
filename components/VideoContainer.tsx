import React, { useEffect, useRef, useState } from 'react';
import { APP_CONFIG, UI_TEXT, Icons } from '../constants';
import { useAppStore } from '../store/useAppStore';

interface VideoContainerProps {
  stream?: MediaStream | null;
  videoUrl?: string | null;
  muted?: boolean;
  label: string;
  isRemote?: boolean;
  isVideoOff?: boolean;
  iceState?: string;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({ 
  stream, 
  videoUrl,
  muted, 
  label, 
  isRemote, 
  isVideoOff,
  iceState
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const safetyBlurEnabled = useAppStore((state) => state.safetyBlurEnabled);
  const devMode = useAppStore((state) => state.devMode);
  const [isBlurring, setIsBlurring] = useState(isRemote && safetyBlurEnabled);

  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = "";
      }
    } else if (videoUrl) {
      if (videoRef.current.src !== videoUrl) {
        videoRef.current.srcObject = null;
        videoRef.current.src = videoUrl;
        videoRef.current.loop = true;
      }
    }
    if (!isVideoOff && (stream || videoUrl)) {
      videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
    }
  }, [stream, videoUrl, isVideoOff]);

  useEffect(() => {
    if (isRemote && (stream || videoUrl) && safetyBlurEnabled) {
      setIsBlurring(true);
      const timer = setTimeout(() => setIsBlurring(false), APP_CONFIG.BLUR_DURATION_MS);
      return () => clearTimeout(timer);
    } else {
      setIsBlurring(false);
    }
  }, [isRemote, stream, videoUrl, safetyBlurEnabled]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const showPlaceholder = (!stream && !videoUrl) || isVideoOff;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-neutral-900 rounded-2xl overflow-hidden ring-1 ring-white/10 group shadow-2xl flex items-center justify-center">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={muted} 
        crossOrigin="anonymous"
        data-remote={isRemote ? "true" : "false"} 
        className={\`w-full h-full object-cover transition-all duration-[5000ms] ease-out will-change-[filter,transform] \${isBlurring ? 'blur-[40px]' : 'blur-0'} \${showPlaceholder ? 'hidden' : 'block'}\`}
      />
      {showPlaceholder && (
        <div className="flex items-center justify-center w-full h-full text-neutral-600 bg-neutral-900 absolute inset-0">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
              {isVideoOff ? <Icons.VideoOff /> : <Icons.Video />}
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 text-center px-4">
              {isVideoOff ? UI_TEXT.chat.cameraDisabled : UI_TEXT.chat.signalLost}
            </span>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/10">{label}</div>
          {isBlurring && isRemote && <div className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-400 ring-1 ring-cyan-500/50 animate-pulse">BLUR</div>}
        </div>
        
        {devMode && isRemote && iceState && (
          <div className={\`px-2 py-0.5 rounded bg-black/60 text-[8px] font-mono uppercase tracking-widest border border-white/10 \${
            iceState === 'connected' || iceState === 'completed' ? 'text-green-400' : 
            iceState === 'failed' || iceState === 'disconnected' ? 'text-red-400' : 'text-amber-400'
          }\`}> 
            ICE: {iceState}
          </div>
        )}
      </div>

      {/* Non-interactive mute icon (Option A) placed bottom-left. Reflects the muted prop but does not handle clicks. */}
      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 transition-colors ring-1 ring-white/5 shadow-lg pointer-events-none" title={muted ? "Muted" : "Unmuted"}>
          {muted ? <Icons.MicOff /> : <Icons.Mic />}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={handleToggleFullscreen} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors ring-1 ring-white/5 shadow-lg" title="Toggle fullscreen">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 9l-6 0"/><path d="M3 15l6 0"/></svg>
        </button>
      </div>
    </div>
  );
};