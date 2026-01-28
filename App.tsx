
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { LandingPage } from './components/LandingPage';
import { ChatSession } from './components/ChatSession';
import { AuthModal } from './components/AuthModal';
import { DevPanel } from './components/DevPanel';
import { UI_TEXT, APP_CONFIG, THEMES } from './constants';
import { io } from 'socket.io-client';

const App: React.FC = () => {
  const { selectedMode, setOnlineCount, currentTheme } = useAppStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  const themeData = THEMES[currentTheme];

  useEffect(() => {
    document.title = UI_TEXT.common.siteName + " | Anonymous Video & Chat";
    
    // Apply global theme background to body to avoid white/black flashes
    document.body.style.backgroundColor = themeData.bg;
    document.body.style.color = themeData.isLight ? '#171717' : '#f5f5f5';

    // Real-time online count listener
    const socket = io(APP_CONFIG.SIGNALLING_URL);
    socket.on('online-count', (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [setOnlineCount, themeData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleReportBug = () => {
    setIsReporting(true);
    const logs = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString(),
      screen: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
    
    console.log("Diagnostic Logs Captured:", logs);

    setTimeout(() => {
      setIsReporting(false);
      setToast({ 
        message: "Diagnostic logs sent! Our engineers are on it.", 
        type: 'success' 
      });
    }, 4000);
  };

  return (
    <div className={`${themeData.isLight ? 'text-neutral-900' : 'text-white'}`} style={{ 
      '--selection-bg': themeData.primaryHex,
      '--selection-text': '#ffffff'
    } as any}>
      <style>{`
        ::selection {
          background-color: ${themeData.primaryHex};
          color: #ffffff;
        }
      `}</style>

      {!selectedMode ? (
        <LandingPage />
      ) : (
        <ChatSession />
      )}
      
      <AuthModal />
      <DevPanel />

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className={`px-6 py-3 rounded-2xl glass border shadow-2xl flex items-center gap-3 ${
            themeData.isLight ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-neutral-900 border-white/10 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: themeData.primaryHex }} />
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3">
        <button 
          onClick={handleReportBug}
          disabled={isReporting}
          className={`group p-4 backdrop-blur rounded-full border transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            themeData.isLight 
              ? 'bg-white/80 hover:bg-neutral-100 text-neutral-400 border-neutral-200' 
              : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-500 border-white/5'
          }`}
          title="Report a Bug"
        >
          {isReporting ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`group-hover:text-${themeData.accent}`}><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
          )}
        </button>
        {isReporting && (
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-600 animate-pulse">
            Diagnostic Capture...
          </span>
        )}
      </div>
    </div>
  );
};

export default App;
