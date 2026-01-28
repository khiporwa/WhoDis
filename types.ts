
export enum ChatMode {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO'
}

export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  ANY = 'ANY'
}

export interface Message {
  id: string;
  sender: 'me' | 'stranger' | 'system';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  isGuest: boolean;
  name?: string;
  email?: string;
  interests: string[];
  gender: UserGender;
}

export interface PeerConnectionState {
  isSearching: boolean;
  isConnected: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}
