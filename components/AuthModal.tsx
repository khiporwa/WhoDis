
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Icons, UI_TEXT } from '../constants';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, login, signup } = useAppStore();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Hardcoded Developer Credentials Check
    const isDevAttempt = email === 'khiteshjain09@gmail.com';
    const isDevValid = isDevAttempt && password === 'Kjsince2k@whodis';

    setTimeout(() => {
      if (isDevAttempt && !isDevValid) {
        setError("Invalid developer credentials.");
        setLoading(false);
        return;
      }

      if (isLoginView) {
        login(email, isDevValid ? "Admin Khitesh" : (name || email.split('@')[0]));
      } else {
        signup(email, name);
      }
      setLoading(false);
    }, 1200);
  };

  const handleContinueAsGuest = () => {
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 glass rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-neutral-900/50 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{UI_TEXT.auth.tempTitle}</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">{UI_TEXT.auth.tempDesc}</p>
          </div>
          <button onClick={handleContinueAsGuest} className="w-full py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-all border border-white/5 active:scale-[0.98]">
            {UI_TEXT.auth.guestBtn}
          </button>
        </div>

        <div className="p-8 relative">
          <button onClick={() => setAuthModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all z-10">
            <Icons.X />
          </button>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tighter text-white mb-1">
              {isLoginView ? UI_TEXT.auth.signInTitle : UI_TEXT.auth.signUpTitle}
            </h2>
            <p className="text-neutral-500 text-xs">
              {isLoginView ? UI_TEXT.auth.signInDesc : UI_TEXT.auth.signUpDesc}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{error}</p>}
            {!isLoginView && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">{UI_TEXT.auth.nameLabel}</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full bg-neutral-900/80 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">{UI_TEXT.auth.emailLabel}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="w-full bg-neutral-900/80 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">{UI_TEXT.auth.passwordLabel}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-neutral-900/80 border-none rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-neutral-200 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : (isLoginView ? UI_TEXT.auth.loginBtn : UI_TEXT.auth.createAccountBtn)}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-cyan-400 transition-colors">
              {isLoginView ? UI_TEXT.auth.toggleToSignUp : UI_TEXT.auth.toggleToSignIn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
