export interface User {
  id: string;
  phone: string;
  countryCode: string;
  name: string;
  avatar?: string;
  description?: string;
  lastSeen?: Date;
  isOnline: boolean;
  createdAt: Date;
  isBlocked?: boolean;
  isAdmin?: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isSaved: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'poll';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: Reaction[];
  isDeleted?: boolean;
  deletedFor?: string[];
}

export interface Reaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel';
  participants: string[];
  name?: string;
  avatar?: string;
  description?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: Date;
  createdBy?: string;
}

export interface Group extends Chat {
  type: 'group';
  admins: string[];
  settings: GroupSettings;
}

export interface GroupSettings {
  onlyAdminsCanSend: boolean;
  onlyAdminsCanEditInfo: boolean;
  approvalRequired: boolean;
}

export interface Channel extends Chat {
  type: 'channel';
  owner: string;
  admins: string[];
  followersCount: number;
  isOfficial: boolean;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  allowReactions: boolean;
  allowPolls: boolean;
}

export interface Status {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  music?: string;
  viewers: StatusViewer[];
  visibility: 'all' | 'contacts' | 'contacts_except' | 'only_me';
  excludedContacts?: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface StatusViewer {
  userId: string;
  viewedAt: Date;
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface AuthState {
  step: 'phone' | 'otp' | 'profile' | 'complete';
  phone: string;
  countryCode: string;
  otpCode: string;
  user?: User;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'spam' | 'sexual' | 'scam' | 'illegal' | 'hack' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

export interface BlockedUser {
  userId: string;
  blockedAt: Date;
  duration?: number; // in hours, null for permanent
  reason?: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  appealMessage?: string;
}
