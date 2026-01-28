
import React, { useState, useEffect } from 'react';
import { APP_CONFIG, UI_TEXT, THEMES } from '../constants';
import { useAppStore } from '../store/useAppStore';

interface Session {
  id: string;
  count: number;
  lastCapture: string;
}

interface Screenshot {
  name: string;
  url: string;
  timestamp: number;
}

export const AdminGallery: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [images, setImages] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const currentTheme = useAppStore(state => state.currentTheme);
  const themeData = THEMES[currentTheme];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const url = `${APP_CONFIG.SIGNALLING_URL}/api/admin/screenshots`;
    try {
      setLoading(true);
      setErrorMessage(null);
      
      console.debug(`[AdminGallery] Fetching sessions from: ${url}`);
      const res = await fetch(url);
      
      const contentType = res.headers.get("content-type");
      
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        const text = await res.text();
        const snippet = text.substring(0, 100).replace(/</g, "&lt;");
        
        if (res.status === 404) {
          setErrorMessage(`Server Error (404): The API endpoint was not found at the Target URL. This happens because the request is hitting the FRONTEND server instead of the BACKEND server. Verify the SIGNALLING_URL is correct.`);
        } else {
          setErrorMessage(`Server Error: Expected JSON from ${url} but received ${contentType}. Status: ${res.status}. Preview: ${snippet}...`);
        }
        setSessions([]);
      }
    } catch (e: any) {
      setErrorMessage(`Network Error: Failed to reach backend at ${url}. Ensure the server is started (npm run server) and accessible. Error: ${e.message}`);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (sessionId: string) => {
    try {
      const res = await fetch(`${APP_CONFIG.SIGNALLING_URL}/api/admin/screenshots/${sessionId}`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setImages(data);
        setSelectedSession(sessionId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this evidence?')) return;
    try {
      await fetch(`${APP_CONFIG.SIGNALLING_URL}/api/admin/screenshots/${sessionId}`, { method: 'DELETE' });
      if (selectedSession === sessionId) setSelectedSession(null);
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl p-6 md:p-12 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-none">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3 uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {UI_TEXT.dev.galleryTitle}
          </h2>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Law Enforcement & Safety Monitoring Panel</p>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-8">
        {/* Sidebar: Sessions */}
        <div className="w-80 flex-none flex flex-col gap-4 overflow-y-auto pr-4 border-r border-white/5">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : errorMessage ? (
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono leading-relaxed">
              <p className="font-black mb-3 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Connectivity Error
              </p>
              <p className="opacity-80">{errorMessage}</p>
              <div className="mt-6 space-y-2">
                 <button 
                  onClick={fetchSessions}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                  Retry Connection
                </button>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[9px] text-neutral-500 uppercase font-bold text-center break-all">
                  Target: {APP_CONFIG.SIGNALLING_URL}
                </div>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-neutral-600 text-xs text-center py-10 uppercase tracking-widest font-black">{UI_TEXT.dev.galleryEmpty}</p>
          ) : (
            sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => fetchImages(s.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border group relative ${
                  selectedSession === s.id 
                    ? 'bg-cyan-500/10 border-cyan-500/50' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedSession === s.id ? 'text-cyan-400' : 'text-neutral-400'}`}>Session ID</span>
                  <span className="text-white font-mono text-xs truncate mb-2">{s.id}</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-neutral-500 uppercase">{s.count} Captures</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                      title={UI_TEXT.dev.deleteSession}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main: Images */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!selectedSession ? (
            <div className="h-full flex items-center justify-center flex-col text-neutral-700 gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <p className="text-xs uppercase font-black tracking-[0.3em]">Select a session to review</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map(img => (
                <div key={img.name} className="flex flex-col gap-2 group">
                  <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-cyan-500/50 transition-all shadow-xl">
                    <img 
                      src={`${APP_CONFIG.SIGNALLING_URL}${img.url}`} 
                      alt={img.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                      {new Date(img.timestamp).toLocaleTimeString()}
                    </span>
                    <a 
                      href={`${APP_CONFIG.SIGNALLING_URL}${img.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold text-cyan-500 hover:underline uppercase tracking-widest"
                    >
                      Full Size
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
