
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { UserProfile, UserGender, ChatMode } from '../types';

export type ThemeType = 'midnight' | 'cyber' | 'forest' | 'volcano' | 'ocean' | 'gold' | 'daylight';

interface AppState {
  user: UserProfile;
  isLoggedIn: boolean;
  authModalOpen: boolean;
  selectedMode: ChatMode | null;
  isMatching: boolean;
  safetyBlurEnabled: boolean;
  onlineCount: number;
  currentTheme: ThemeType;
  // Dev-only features
  devMode: boolean;
  safetyScreenshotsEnabled: boolean;
  screenshotIntervalMin: number; // in milliseconds
  screenshotIntervalMax: number; // in milliseconds
  
  // Actions
  setUser: (user: Partial<UserProfile>) => void;
  setMode: (mode: ChatMode | null) => void;
  setIsMatching: (val: boolean) => void;
  setSafetyBlur: (enabled: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setDevMode: (enabled: boolean) => void;
  setSafetyScreenshotsEnabled: (enabled: boolean) => void;
  setScreenshotIntervals: (min: number, max: number) => void;
  setOnlineCount: (count: number) => void;
  setTheme: (theme: ThemeType) => void;
  login: (email: string, name: string) => void;
  signup: (email: string, name: string) => void;
  logout: () => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const hybridStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name) || sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    const parsed = JSON.parse(value);
    if (parsed.state.isLoggedIn) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        id: generateId(),
        isGuest: true,
        interests: [],
        gender: UserGender.ANY,
      },
      isLoggedIn: false,
      authModalOpen: false,
      selectedMode: null,
      isMatching: false,
      safetyBlurEnabled: true,
      onlineCount: 1,
      currentTheme: 'midnight',
      devMode: false,
      safetyScreenshotsEnabled: true,
      screenshotIntervalMin: 8000, // Reduced from 15s to 8s for more immediate testing
      screenshotIntervalMax: 20000, // Reduced from 45s to 20s

      setUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
      setMode: (mode) => set({ selectedMode: mode }),
      setIsMatching: (val) => set({ isMatching: val }),
      setSafetyBlur: (enabled) => set({ safetyBlurEnabled: enabled }),
      setAuthModalOpen: (open) => set({ authModalOpen: open }),
      setDevMode: (enabled) => set({ devMode: enabled }),
      setSafetyScreenshotsEnabled: (enabled) => set({ safetyScreenshotsEnabled: enabled }),
      setScreenshotIntervals: (min, max) => set({ screenshotIntervalMin: min, screenshotIntervalMax: max }),
      setOnlineCount: (count) => set({ onlineCount: count }),
      setTheme: (theme) => set({ currentTheme: theme }),
      
      login: (email, name) => {
        const isAdmin = email === 'khiteshjain09@gmail.com';
        set((state) => ({
          isLoggedIn: true,
          authModalOpen: false,
          devMode: isAdmin ? true : state.devMode,
          user: { ...state.user, email, name, isGuest: false }
        }));
      },
      
      signup: (email, name) => set((state) => ({
        isLoggedIn: true,
        authModalOpen: false,
        user: { ...state.user, email, name, isGuest: false }
      })),

      logout: () => {
        localStorage.removeItem('whodis-storage');
        sessionStorage.removeItem('whodis-storage');
        set({
          isLoggedIn: false,
          devMode: false,
          user: {
            id: generateId(),
            isGuest: true,
            interests: [],
            gender: UserGender.ANY,
          }
        });
      },

      addInterest: (interest) => set((state) => ({
        user: { ...state.user, interests: [...new Set([...state.user.interests, interest])] }
      })),
      removeInterest: (interest) => set((state) => ({
        user: { ...state.user, interests: state.user.interests.filter(i => i !== interest) }
      })),
    }),
    {
      name: 'whodis-storage',
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({ 
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        safetyBlurEnabled: state.safetyBlurEnabled,
        devMode: state.devMode,
        safetyScreenshotsEnabled: state.safetyScreenshotsEnabled,
        screenshotIntervalMin: state.screenshotIntervalMin,
        screenshotIntervalMax: state.screenshotIntervalMax,
        currentTheme: state.currentTheme
      }),
    }
  )
);
