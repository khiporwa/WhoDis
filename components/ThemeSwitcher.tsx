
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, ThemeType } from '../store/useAppStore';
import { THEMES, Icons } from '../constants';

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES[currentTheme];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl glass border-white/10 hover:bg-white/5 transition-all active:scale-95 ${activeTheme.isLight ? 'text-neutral-900 border-neutral-200' : 'text-white'}`}
      >
        <Icons.Palette />
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{activeTheme.name}</span>
        <Icons.ChevronDown />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-2xl glass p-2 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 border-white/10 ${activeTheme.isLight ? 'bg-white ring-1 ring-neutral-200' : 'bg-neutral-900 ring-1 ring-white/5'}`}>
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(THEMES) as ThemeType[]).map((t) => {
              const theme = THEMES[t];
              const isSelected = currentTheme === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-xl transition-all group ${
                    isSelected 
                      ? (theme.isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-white/10 text-white')
                      : (activeTheme.isLight ? 'hover:bg-neutral-50 text-neutral-600' : 'hover:bg-white/5 text-neutral-400')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: theme.primaryHex }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{theme.name}</span>
                  </div>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryHex }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
