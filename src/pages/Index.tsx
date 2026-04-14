import React, { useState, useEffect } from 'react';
import { MessageCircle, Radio, Phone, Settings, Shield } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { CallScreen } from '@/components/CallScreen';
import { BottomNav } from '@/components/BottomNav';
import { BlockedScreen } from '@/components/BlockedScreen';
import { CameraPage } from '@/components/CameraPage';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useChats, type ChatWithDetails } from '@/hooks/useChats';
import { useStatuses, type StatusType } from '@/hooks/useStatuses';
import { useCalls } from '@/hooks/useCalls';
import { usePresence } from '@/hooks/usePresence';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useWebRTC } from '@/hooks/useWebRTC';

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
  const { user, profile, loading, isAdmin, isBlocked, blockInfo } = useAuth();
  const { toast } = useToast();
  const { chats, fetchChats, createPrivateChat, createGroupChat } = useChats(user?.id);
  const { myStatuses, contactStatuses, createStatus, viewStatus } = useStatuses(user?.id);
  const { initiateCall, endCall, activeCall } = useCalls(user?.id);
  const { registerServiceWorker, isSubscribed: isPushSubscribed } = usePushNotifications(user?.id);
  const webRTC = useWebRTC(user?.id);
  
  // Initialize presence tracking
  usePresence(user?.id);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);
  
  // ALL useState hooks MUST be called before any early returns
  const [currentView, setCurrentView] = useState<View>('chats');
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [selectedUserStatuses, setSelectedUserStatuses] = useState<StatusType[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [showCameraPage, setShowCameraPage] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<'main' | 'archived'>('main');
  const [callInfo, setCallInfo] = useState<{ type: 'voice' | 'video'; name: string; avatar?: string } | null>(null);
  const [[page, direction], setPage] = useState([0, 0]);

  // Show notification prompt after first login if not subscribed
  useEffect(() => {
    if (user && !isPushSubscribed && 'Notification' in window && Notification.permission === 'default') {
      const hasShownPrompt = localStorage.getItem('push_prompt_shown');
      if (!hasShownPrompt) {
        setTimeout(() => {
          setShowNotificationPrompt(true);
          localStorage.setItem('push_prompt_shown', 'true');
        }, 3000);
      }
    }
  }, [user, isPushSubscribed]);

  // Filter channels from chat list - channels only appear in Status page
  const privateAndGroupChats = chats.filter(c => c.type !== 'channel');
  const channels = chats.filter(c => c.type === 'channel');

  // Calculate total unread messages for badge
  const totalUnread = privateAndGroupChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: 'chats', badge: totalUnread > 0 ? totalUnread : undefined },
    { icon: Radio, label: 'Status', path: 'status' },
    { icon: Phone, label: 'Calls', path: 'calls' },
    { icon: Settings, label: 'Settings', path: 'settings' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: 'admin' }] : []),
  ];

  // useEffect MUST be called before any early returns
  useEffect(() => {
    setPage([activeNavIndex, activeNavIndex > page ? 1 : -1]);
  }, [activeNavIndex, page]);

  // Handle incoming calls
  useEffect(() => {
    if (webRTC.incomingCall) {
      setCallInfo({
        type: webRTC.incomingCall.callType,
        name: webRTC.incomingCall.callerName,
      });
      setShowCallScreen(true);
    }
  }, [webRTC.incomingCall]);

  // Early returns AFTER all hooks
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  // Show blocked screen if user is blocked by admin
  if (isBlocked && blockInfo) {
    return <BlockedScreen blockInfo={blockInfo} />;
  }

  const handleNavigate = (index: number) => {
    // Clamp index to valid range
    const maxIndex = navItems.length - 1;
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setActiveNavIndex(clampedIndex);
    const path = navItems[clampedIndex].path as View;
    setCurrentView(path);
    setSelectedChat(null);
  };

  // Swipe handler for navigation
  const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 0.5;
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocity) {
      if (info.offset.x > 0) {
        // Swipe right - check if on chat page to open camera
        if (activeNavIndex === 0 && currentView === 'chats') {
          setShowCameraPage(true);
          return;
        }
        // Otherwise go to previous page
        handleNavigate(activeNavIndex - 1);
      } else {
        // Swipe left - go to next page
        handleNavigate(activeNavIndex + 1);
      }
    }
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
    const { data, error } = await createPrivateChat(otherUserId);

    if (error) {
      toast({
        title: 'Gagal membuka chat',
        description: error.message || 'Terjadi kesalahan saat membuat chat',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      setSelectedChat(data);
      setCurrentView('chatroom');
      setShowAddContact(false);
      return;
    }

    toast({
      title: 'Chat tidak ditemukan',
      description: 'Tidak bisa membuka chat dengan pengguna tersebut.',
      variant: 'destructive',
    });
  };

  const handleCreateGroup = async (name: string, participantIds: string[], isChannel?: boolean) => {
    const { data } = await createGroupChat(name, participantIds, isChannel);
    if (data) {
      setSelectedChat(data);
      setCurrentView('chatroom');
    }
    setShowCreateGroup(false);
    setShowCreateChannel(false);
  };

  const handleCreateStatus = async (
    type: 'text' | 'image' | 'video',
    content: string,
    options?: any
  ) => {
    await createStatus(type, content, options);
    setShowCreateStatus(false);
  };

  const handleCall = async (receiverId: string, type: 'voice' | 'video') => {
    if (!receiverId) {
      // For group chats, get the other user
      return;
    }
    try {
      // Get receiver profile
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', receiverId)
        .single();

      setCallInfo({
        type,
        name: receiverProfile?.name || 'Unknown',
        avatar: receiverProfile?.avatar_url || undefined,
      });
      setShowCallScreen(true);
      
      await webRTC.startCall(receiverId, type);
    } catch (err: any) {
      console.error('Call failed:', err);
      setShowCallScreen(false);
      setCallInfo(null);
    }
  };

  const handleAnswerCall = async () => {
    await webRTC.answerCall();
  };

  const handleEndCall = async () => {
    webRTC.endCall();
    setShowCallScreen(false);
    setCallInfo(null);
  };


  // Slide variants for page transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'chats':
        return (
          <ChatDashboard
            chats={privateAndGroupChats}
            onChatSelect={handleChatSelect}
            onAddContact={() => setShowAddContact(true)}
            onAddGroup={() => setShowCreateGroup(true)}
            onAddChannel={() => setShowCreateChannel(true)}
            onSettings={() => {
              setSettingsInitialView('main');
              handleNavigate(3);
            }}
            onOpenArchived={() => {
              setSettingsInitialView('archived');
              handleNavigate(3);
            }}
            userId={user.id}
            onRefresh={fetchChats}
          />
        );
      case 'status':
        return (
          <StatusPage
            myStatuses={myStatuses}
            contactStatuses={contactStatuses}
            channels={channels}
            profile={profile}
            onViewStatus={handleViewStatus}
            onCreateStatus={() => setShowCreateStatus(true)}
            onChannelSelect={handleChatSelect}
          />
        );
      case 'calls':
        return <CallsPage onCall={handleCall} />;
      case 'settings':
        return (
          <SettingsPage
            onEditProfile={() => setShowEditProfile(true)}
            initialView={settingsInitialView}
          />
        );
      case 'admin':
        return isAdmin ? <AdminPanel userId={user.id} onBack={() => handleNavigate(0)} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {currentView === 'chatroom' && selectedChat ? (
        <ChatRoom
          chat={selectedChat}
          userId={user.id}
          onBack={handleBackFromChat}
          onCall={(targetUserId) => handleCall(targetUserId, 'voice')}
          onVideoCall={(targetUserId) => handleCall(targetUserId, 'video')}
          onInfo={() => {}}
          onChatWithUser={handleCreateChat}
        />
      ) : (
        <motion.div
          key={currentView}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleSwipe}
          initial="enter"
          animate="center"
          exit="exit"
          variants={slideVariants}
          custom={direction}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="min-h-screen"
        >
          {renderCurrentView()}
        </motion.div>
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
        mode="group"
      />

      <CreateGroupModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        userId={user.id}
        onCreateGroup={handleCreateGroup}
        mode="channel"
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

      {/* Call Screen */}
      {callInfo && (
        <CallScreen
          isOpen={showCallScreen}
          onClose={() => setShowCallScreen(false)}
          callType={callInfo.type}
          callerName={callInfo.name}
          callerAvatar={callInfo.avatar}
          isIncoming={!!webRTC.incomingCall}
          onAnswer={handleAnswerCall}
          onDecline={handleEndCall}
          onEndCall={handleEndCall}
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          callState={webRTC.callState}
          callDuration={webRTC.callDuration}
          isMuted={webRTC.isMuted}
          isVideoOff={webRTC.isVideoOff}
          onToggleMute={webRTC.toggleMute}
          onToggleVideo={webRTC.toggleVideo}
          onSwitchCamera={webRTC.switchCamera}
        />
      )}

      {/* Camera Page */}
      <AnimatePresence>
        {showCameraPage && (
          <CameraPage
            isOpen={showCameraPage}
            onClose={() => setShowCameraPage(false)}
            userId={user.id}
            onPostStatus={async (mediaUrl, type) => {
              await createStatus(type, '', { mediaUrl });
              setShowCameraPage(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification Prompt */}
      <NotificationPrompt
        userId={user.id}
        isOpen={showNotificationPrompt}
        onClose={() => setShowNotificationPrompt(false)}
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
