
import React, { useState, useRef, useEffect } from 'react';
import { Icons, UI_TEXT, THEMES } from '../constants';
import { Message } from '../types';
import { useAppStore } from '../store/useAppStore';

interface ChatOverlayProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping?: boolean;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentTheme = useAppStore(state => state.currentTheme);
  const themeData = THEMES[currentTheme];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 glass rounded-2xl overflow-hidden ring-1 ${themeData.isLight ? 'bg-white/40 border-neutral-200 ring-neutral-200' : 'border-white/10 ring-white/10'}`}>
      <div className={`flex-none p-4 border-b flex items-center justify-between ${themeData.isLight ? 'bg-neutral-50/80 border-neutral-200' : 'bg-neutral-900/40 border-white/5'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: themeData.primaryHex }} />
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${themeData.isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>{UI_TEXT.chat.liveChatTitle}</h3>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm break-words transition-colors duration-500 ${
              msg.sender === 'me' 
                ? 'text-white rounded-br-none shadow-md' 
                : msg.sender === 'system' 
                  ? `${themeData.isLight ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-800/50 text-neutral-500'} text-center italic w-full py-1 text-[11px]` 
                  : `${themeData.isLight ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-800 text-neutral-200'} rounded-bl-none shadow-sm`
            }`} style={msg.sender === 'me' ? { backgroundColor: themeData.primaryHex } : {}}>
              {msg.text}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start">
            <div className={`px-4 py-2 rounded-2xl rounded-bl-none animate-pulse ${themeData.isLight ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
              <div className="flex gap-1">
                <div className={`w-1 h-1 rounded-full ${themeData.isLight ? 'bg-neutral-400' : 'bg-neutral-500'}`} />
                <div className={`w-1 h-1 rounded-full animate-bounce [animation-delay:0.2s] ${themeData.isLight ? 'bg-neutral-400' : 'bg-neutral-500'}`} />
                <div className={`w-1 h-1 rounded-full animate-bounce [animation-delay:0.4s] ${themeData.isLight ? 'bg-neutral-400' : 'bg-neutral-500'}`} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`flex-none p-4 border-t ${themeData.isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/80 border-white/5'}`}>
        <div className="relative flex items-center gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={UI_TEXT.chat.typePlaceholder} 
            className={`flex-1 border-none rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-1 ${
              themeData.isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-800 text-white'
            }`} 
            style={{ '--tw-ring-color': themeData.primaryHex } as any}
          />
          <button 
            type="submit" 
            className="p-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-neutral-800 shadow-lg active:scale-95" 
            disabled={!input.trim()}
            style={{ backgroundColor: themeData.primaryHex }}
          >
            <Icons.Send />
          </button>
        </div>
      </form>
    </div>
  );
};
