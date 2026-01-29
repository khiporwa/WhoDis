
import React from 'react';
import { UI_TEXT as uiText } from './ui-text';

export const UI_TEXT = uiText;

export interface ThemeConfig {
  name: string;
  primary: string;
  primaryHex: string;
  bg: string;
  glow: string;
  accent: string;
  isLight?: boolean;
}

export const THEMES: Record<string, ThemeConfig> = {
  midnight: {
    name: 'Midnight',
    primary: 'cyan-500',
    primaryHex: '#06b6d4',
    bg: '#0a0a0a',
    glow: 'rgba(6,182,212,0.5)',
    accent: 'cyan-400'
  },
  cyber: {
    name: 'Cyberpunk',
    primary: 'fuchsia-500',
    primaryHex: '#d946ef',
    bg: '#0a0a0a',
    glow: 'rgba(217,70,239,0.5)',
    accent: 'fuchsia-400'
  },
  forest: {
    name: 'Forest',
    primary: 'emerald-500',
    primaryHex: '#10b981',
    bg: '#050a05',
    glow: 'rgba(16,185,129,0.5)',
    accent: 'emerald-400'
  },
  volcano: {
    name: 'Volcano',
    primary: 'rose-500',
    primaryHex: '#f43f5e',
    bg: '#0a0505',
    glow: 'rgba(244,63,94,0.5)',
    accent: 'rose-400'
  },
  ocean: {
    name: 'Ocean',
    primary: 'sky-500',
    primaryHex: '#0ea5e9',
    bg: '#05080a',
    glow: 'rgba(14,165,233,0.5)',
    accent: 'sky-400'
  },
  gold: {
    name: 'Elysium',
    primary: 'amber-500',
    primaryHex: '#f59e0b',
    bg: '#0a0905',
    glow: 'rgba(245,158,11,0.5)',
    accent: 'amber-400'
  },
  daylight: {
    name: 'Daylight (Inverted)',
    primary: 'blue-600',
    primaryHex: '#2563eb',
    bg: '#ffffff',
    glow: 'rgba(37,99,235,0.1)',
    accent: 'blue-700',
    isLight: true
  }
};

const getSignalingUrl = () => {
  const { hostname, protocol, port, origin } = window.location;

  const viteUrl = (import.meta as any).env?.VITE_API_URL;
  if (viteUrl) return viteUrl.replace(/\/$/, "");

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }

  if (hostname.includes('5173')) {
    return `${protocol}//${hostname.replace('5173', '5000')}`;
  }

  if (hostname.includes('.scf.usercontent.goog') || hostname.includes('webcontainer-api.io')) {
    if (!hostname.startsWith('5000-') && !hostname.startsWith('5173-')) {
      return `${protocol}//5000-${hostname}`;
    }
    if (hostname.startsWith('5173-')) {
      return `${protocol}//${hostname.replace('5173-', '5000-')}`;
    }
  }

  if (port === '5173') {
     return `${protocol}//${hostname}:5000`;
  }

  return origin;
};

export const APP_CONFIG = {
  ICEBREAKER_SILENCE_TIMEOUT: 10000,
  BLUR_DURATION_MS: 5000,
  
  // Robust ICE Servers for production stability
  // Using a mix of high-reliability STUN servers and public relay candidates
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public free TURN relay candidates - essential for mobile networks
    { urls: 'stun:stun.relay.metered.ca:80' }
  ],

  ALLOW_SIMULATION: true,
  
  SIMULATION_LIBRARY: [
    {
      id: 'sim-1',
      name: 'Alex',
      videoUrl: 'https://cdn.pixabay.com/vimeo/328941243/portrait-11440.mp4',
      initialMessage: "Hey! Just chilling. What's up?"
    },
    {
      id: 'sim-2',
      name: 'Jordan',
      videoUrl: 'https://cdn.pixabay.com/vimeo/453164147/man-48810.mp4',
      initialMessage: "Yo! Cool profile. You like coding?"
    }
  ],

  SIGNALLING_URL: getSignalingUrl()
};

export const Icons = {
  Video: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
  ),
  Message: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
  ),
  Skip: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H17c2.8 0 5-2.2 5-5 0-5.3-4.5-9.5-10-9.5z"/></svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
};
