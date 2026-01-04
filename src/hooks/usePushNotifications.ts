import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// VAPID public key - this should match the one in your secrets
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getApplicationServerKey(vapidKey: string): ArrayBuffer | null {
  if (!vapidKey) return null;
  const uint8Array = urlBase64ToUint8Array(vapidKey);
  return uint8Array.buffer as ArrayBuffer;
}

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
      }
      setLoading(false);
    };
    checkSupport();
  }, []);

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !userId) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Verify it's in our database
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('endpoint', subscription.endpoint)
            .single();
          
          setIsSubscribed(!!data);
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[Push] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }, [isSupported]);

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) {
      console.log('[Push] Not supported or no user');
      return false;
    }

    try {
      setLoading(true);

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        console.log('[Push] Permission denied');
        return false;
      }

      // Register or get service worker
      let registration = await navigator.serviceWorker.ready;
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) return false;
        await navigator.serviceWorker.ready;
        registration = await navigator.serviceWorker.ready;
      }

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && VAPID_PUBLIC_KEY) {
        // Create new subscription
        const applicationServerKey = getApplicationServerKey(VAPID_PUBLIC_KEY);
        if (applicationServerKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
          console.log('[Push] New subscription created');
        }
      }

      if (subscription) {
        // Save to database
        const subscriptionData = subscription.toJSON();
        
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            keys: subscriptionData.keys,
          }, {
            onConflict: 'user_id,endpoint',
          });

        if (error) {
          console.error('[Push] Error saving subscription:', error);
          return false;
        }

        setIsSubscribed(true);
        console.log('[Push] Subscription saved');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId, registerServiceWorker]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !userId) return false;

    try {
      setLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      console.log('[Push] Unsubscribed');
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId]);

  // Send notification to specific users
  const sendNotification = useCallback(async (
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    tag?: string
  ) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: { userIds, title, body, data, tag },
      });

      if (error) {
        console.error('[Push] Send error:', error);
        return false;
      }

      console.log('[Push] Send result:', result);
      return true;
    } catch (error) {
      console.error('[Push] Send error:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendNotification,
    registerServiceWorker,
  };
}
