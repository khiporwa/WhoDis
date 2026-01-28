
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { UI_TEXT } from '../constants';
import { AdminGallery } from './AdminGallery';

export const DevPanel: React.FC = () => {
  const { 
    devMode, 
    setDevMode, 
    safetyScreenshotsEnabled, 
    setSafetyScreenshotsEnabled,
    screenshotIntervalMin,
    screenshotIntervalMax,
    setScreenshotIntervals
  } = useAppStore();

  const [galleryOpen, setGalleryOpen] = useState(false);

  if (!devMode) return null;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScreenshotIntervals(val, Math.max(val + 1000, screenshotIntervalMax));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScreenshotIntervals(Math.min(val - 1000, screenshotIntervalMin), val);
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[100] w-72 glass p-6 rounded-[2rem] border-cyan-500/30 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">{UI_TEXT.dev.title}</h3>
          <button 
            onClick={() => setDevMode(false)}
            className="text-neutral-500 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{UI_TEXT.dev.safetyScreenshots}</span>
              <span className="text-[8px] text-neutral-500 uppercase">{UI_TEXT.dev.safetyScreenshotsDesc}</span>
            </div>
            <button 
              onClick={() => setSafetyScreenshotsEnabled(!safetyScreenshotsEnabled)}
              className={`w-10 h-5 rounded-full transition-all relative flex items-center ${safetyScreenshotsEnabled ? 'bg-cyan-500' : 'bg-neutral-800'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute transition-all ${safetyScreenshotsEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Min Interval: {screenshotIntervalMin / 1000}s</label>
              </div>
              <input 
                type="range" 
                min="2000" 
                max="60000" 
                step="1000"
                value={screenshotIntervalMin}
                onChange={handleMinChange}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Max Interval: {screenshotIntervalMax / 1000}s</label>
              </div>
              <input 
                type="range" 
                min="3000" 
                max="120000" 
                step="1000"
                value={screenshotIntervalMax}
                onChange={handleMaxChange}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <button 
            onClick={() => setGalleryOpen(true)}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            {UI_TEXT.dev.viewGallery}
          </button>
          
          <div className="pt-2 border-t border-white/5">
            <p className="text-[8px] text-neutral-600 uppercase leading-tight">
              {UI_TEXT.dev.footer}
            </p>
          </div>
        </div>
      </div>

      {galleryOpen && <AdminGallery onClose={() => setGalleryOpen(false)} />}
    </>
  );
};
