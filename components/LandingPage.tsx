
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ChatMode, UserGender } from '../types';
import { Icons, UI_TEXT, THEMES } from '../constants';
import { ThemeSwitcher } from './ThemeSwitcher';

export const LandingPage: React.FC = () => {
  const { 
    user, 
    isLoggedIn, 
    setMode, 
    addInterest, 
    removeInterest, 
    safetyBlurEnabled, 
    setSafetyBlur,
    setAuthModalOpen,
    logout,
    setDevMode,
    devMode,
    onlineCount,
    currentTheme
  } = useAppStore();
  
  const [interestInput, setInterestInput] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);

  const themeData = THEMES[currentTheme];
  const primaryColorClass = `text-${themeData.primary}`;
  const primaryBgClass = `bg-${themeData.primary}`;
  const textColorClass = themeData.isLight ? 'text-neutral-900' : 'text-white';
  const mutedTextColorClass = themeData.isLight ? 'text-neutral-500' : 'text-neutral-500';

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

  const handleStart = (mode: ChatMode) => {
    setMode(mode);
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      addInterest(interestInput.trim().toLowerCase());
      setInterestInput('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-700 overflow-hidden relative" style={{ backgroundColor: themeData.bg }}>
      <div className="fixed top-0 left-0 w-full p-6 flex items-center justify-between z-50">
        <button 
          onClick={handleLogoClick}
          className="text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity active:scale-95 flex items-center gap-1"
        >
          <span className={textColorClass}>{UI_TEXT.common.siteNamePrefix}</span>
          <span className={primaryColorClass}>{UI_TEXT.common.siteNameSuffix}</span>
        </button>
        
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border ${themeData.isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-white/5 border-white/5'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLoggedIn ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${mutedTextColorClass}`}>
              {isLoggedIn ? UI_TEXT.landing.permSession : UI_TEXT.landing.tempSession}
            </span>
          </div>
          
          {isLoggedIn ? (
            <div className={`flex items-center gap-3 glass px-4 py-2 rounded-full border-white/10 ${themeData.isLight ? 'border-neutral-200' : ''}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${textColorClass}`}>{user.name}</span>
              <div className={`w-[1px] h-4 ${themeData.isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />
              <button 
                onClick={logout}
                className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors"
              >
                {UI_TEXT.landing.logoutBtn}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setAuthModalOpen(true)}
              className={`glass px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all ${textColorClass} ${themeData.isLight ? 'border-neutral-200' : 'border-white/10'}`}
            >
              {UI_TEXT.landing.signInBtn}
            </button>
          )}
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ backgroundColor: themeData.glow }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ backgroundColor: themeData.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }} />
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 z-10 pt-20">
        <div className="space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border uppercase tracking-widest text-[10px] font-black ${themeData.isLight ? 'bg-neutral-100 border-neutral-200 text-neutral-600' : 'bg-white/5 border-white/10 text-white/80'}`}>
            {isLoggedIn ? UI_TEXT.landing.authMode : UI_TEXT.landing.guestMode}
          </div>
          <h1 className={`text-7xl md:text-9xl font-black tracking-tighter ${textColorClass}`}>
            {UI_TEXT.common.siteNamePrefix}<span className={primaryColorClass}>{UI_TEXT.common.siteNameSuffix}</span>
          </h1>
          <p className={`${mutedTextColorClass} text-lg md:text-xl max-w-lg mx-auto leading-relaxed font-light`}>
            {UI_TEXT.landing.tagline}
          </p>
        </div>

        <div className={`w-full max-w-2xl space-y-6 glass p-8 rounded-[2.5rem] ${themeData.isLight ? 'bg-white/50 border-neutral-200 shadow-xl' : 'border-white/10'}`}>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">
                {UI_TEXT.landing.interestsLabel}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={handleAddInterest}
                  placeholder={UI_TEXT.landing.interestsPlaceholder}
                  className={`w-full border-none rounded-2xl px-5 py-4 text-base outline-none transition-all placeholder:text-neutral-400 ${
                    themeData.isLight 
                      ? 'bg-neutral-100 text-neutral-900 focus:ring-2 focus:ring-blue-600' 
                      : 'bg-neutral-900/50 text-white focus:ring-2 focus:ring-fuchsia-500'
                  }`}
                  style={{ 
                    '--tw-ring-color': themeData.primaryHex 
                  } as any}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                   <Icons.Message />
                </div>
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between px-2 pt-2 border-t ${themeData.isLight ? 'border-neutral-200' : 'border-white/5'}`}>
             <div className="flex flex-col text-left">
                <span className={`text-xs font-bold uppercase tracking-wider ${textColorClass}`}>{UI_TEXT.landing.safetyBlurTitle}</span>
                <span className="text-[10px] text-neutral-500 uppercase">{UI_TEXT.landing.safetyBlurDesc}</span>
             </div>
             <button 
                onClick={() => setSafetyBlur(!safetyBlurEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative flex items-center ${safetyBlurEnabled ? primaryBgClass : (themeData.isLight ? 'bg-neutral-200 ring-1 ring-neutral-300' : 'bg-neutral-800 ring-1 ring-white/10')}`}
             >
                <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${safetyBlurEnabled ? 'left-7' : 'left-1'}`} />
             </button>
          </div>

          {user.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {user.interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => removeInterest(interest)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all group flex items-center gap-1 ${
                    themeData.isLight 
                      ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50' 
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10'
                  }`}
                >
                  #{interest}
                  <Icons.X />
                </button>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => handleStart(ChatMode.VIDEO)}
              className={`group relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98] uppercase tracking-tighter ${
                themeData.isLight 
                  ? 'bg-neutral-900 text-white hover:bg-black' 
                  : 'bg-white text-black hover:opacity-90'
              }`}
            >
              <Icons.Video />
              {UI_TEXT.landing.videoChatBtn}
            </button>
            <button
              onClick={() => handleStart(ChatMode.TEXT)}
              className={`group flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98] ring-1 uppercase tracking-tighter ${
                themeData.isLight 
                  ? 'bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50' 
                  : 'bg-neutral-800 text-white ring-white/10 hover:bg-neutral-700'
              }`}
            >
              <Icons.Message />
              {UI_TEXT.landing.textChatBtn}
            </button>
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className={`font-black text-4xl tracking-tighter ${textColorClass}`}>{onlineCount.toLocaleString()}</span>
              <span className={`text-[10px] uppercase tracking-[0.2em] ${primaryColorClass} font-black`}>{UI_TEXT.common.onlineCount}</span>
            </div>
          </div>
          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.3em] max-w-xs leading-relaxed font-bold">
            {isLoggedIn ? UI_TEXT.landing.footerNoteAuth : UI_TEXT.landing.footerNoteGuest}
          </p>
        </div>
      </div>
    </div>
  );
};
