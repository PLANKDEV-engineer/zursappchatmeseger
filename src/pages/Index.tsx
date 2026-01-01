import React, { useState, useEffect } from 'react';
import { MessageCircle, Radio, Phone, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { AuthPage } from '@/pages/AuthPage';
import { ChatDashboard } from '@/components/ChatDashboard';
import { ChatRoom } from '@/components/ChatRoom';
import { StatusPage } from '@/components/StatusPage';
import { CallsPage } from '@/components/CallsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { AdminPanel } from '@/components/AdminPanel';
import { AddContactModal } from '@/components/AddContactModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { CreateStatusModal } from '@/components/CreateStatusModal';
import { StatusViewer } from '@/components/StatusViewer';
import { EditProfileModal } from '@/components/EditProfileModal';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import { useChats, type ChatWithDetails } from '@/hooks/useChats';
import { useStatuses, type StatusType } from '@/hooks/useStatuses';

type View = 'chats' | 'status' | 'calls' | 'settings' | 'admin' | 'chatroom';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
      <div className="space-y-2 w-48">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading, isAdmin } = useAuth();
  const { chats, createPrivateChat, createGroupChat } = useChats(user?.id);
  const { myStatuses, contactStatuses, createStatus, viewStatus } = useStatuses(user?.id);
  
  const [currentView, setCurrentView] = useState<View>('chats');
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [selectedUserStatuses, setSelectedUserStatuses] = useState<StatusType[]>([]);

  // Modal states
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: 'chats' },
    { icon: Radio, label: 'Status', path: 'status' },
    { icon: Phone, label: 'Calls', path: 'calls' },
    { icon: Settings, label: 'Settings', path: 'settings' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: 'admin' }] : []),
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigate = (index: number) => {
    setActiveNavIndex(index);
    const path = navItems[index].path as View;
    setCurrentView(path);
    setSelectedChat(null);
  };

  const handleChatSelect = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    setCurrentView('chatroom');
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    setCurrentView('chats');
    setActiveNavIndex(0);
  };

  const handleViewStatus = (userStatuses: StatusType[]) => {
    setSelectedUserStatuses(userStatuses);
    setShowStatusViewer(true);
    userStatuses.forEach(status => {
      viewStatus(status.id);
    });
  };

  const handleCreateChat = async (otherUserId: string) => {
    const { data } = await createPrivateChat(otherUserId);
    if (data) {
      setSelectedChat(data as ChatWithDetails);
      setCurrentView('chatroom');
    }
    setShowAddContact(false);
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    const { data } = await createGroupChat(name, participantIds);
    if (data) {
      setSelectedChat(data as ChatWithDetails);
      setCurrentView('chatroom');
    }
    setShowCreateGroup(false);
  };

  const handleCreateStatus = async (
    type: 'text' | 'image' | 'video',
    content: string,
    options?: any
  ) => {
    await createStatus(type, content, options);
    setShowCreateStatus(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'chats' && (
        <ChatDashboard
          chats={chats}
          onChatSelect={handleChatSelect}
          onAddContact={() => setShowAddContact(true)}
          onAddGroup={() => setShowCreateGroup(true)}
          onAddChannel={() => setShowCreateGroup(true)}
          onSettings={() => handleNavigate(3)}
        />
      )}

      {currentView === 'chatroom' && selectedChat && (
        <ChatRoom
          chat={selectedChat}
          userId={user.id}
          onBack={handleBackFromChat}
          onCall={() => {}}
          onVideoCall={() => {}}
          onInfo={() => {}}
        />
      )}

      {currentView === 'status' && (
        <StatusPage
          myStatuses={myStatuses}
          contactStatuses={contactStatuses}
          profile={profile}
          onViewStatus={handleViewStatus}
          onCreateStatus={() => setShowCreateStatus(true)}
        />
      )}

      {currentView === 'calls' && <CallsPage onCall={() => {}} />}

      {currentView === 'settings' && (
        <SettingsPage onEditProfile={() => setShowEditProfile(true)} />
      )}

      {currentView === 'admin' && isAdmin && (
        <AdminPanel userId={user.id} onBack={() => handleNavigate(0)} />
      )}

      {currentView !== 'chatroom' && currentView !== 'admin' && (
        <BottomNav
          items={navItems}
          activeIndex={activeNavIndex}
          onNavigate={handleNavigate}
        />
      )}

      {/* Modals */}
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        userId={user.id}
        onCreateChat={handleCreateChat}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        userId={user.id}
        onCreateGroup={handleCreateGroup}
      />

      <CreateStatusModal
        isOpen={showCreateStatus}
        onClose={() => setShowCreateStatus(false)}
        onCreateStatus={handleCreateStatus}
      />

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <StatusViewer
        isOpen={showStatusViewer}
        onClose={() => setShowStatusViewer(false)}
        statuses={selectedUserStatuses}
        onView={viewStatus}
      />
    </div>
  );
}

const Index = () => {
  return (
    <ChatProvider>
      <AppContent />
      <Toaster />
    </ChatProvider>
  );
};

export default Index;
