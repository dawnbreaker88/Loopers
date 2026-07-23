import webPush from 'web-push';
import dotenv from 'dotenv';
import AdminSubscription from '../models/AdminSubscription.js';
import UserSubscription from '../models/UserSubscription.js';

dotenv.config();

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.warn('[Push Service Alert] VAPID keys not configured in environment variables. Generating ephemeral keys for MVP...');
  const generated = webPush.generateVAPIDKeys();
  vapidKeys.publicKey = generated.publicKey;
  vapidKeys.privateKey = generated.privateKey;
  console.info(`\n=======================================================\n[Push Service Info] Ephemeral VAPID Keys:\nPublic Key:  ${vapidKeys.publicKey}\nPrivate Key: ${vapidKeys.privateKey}\n=======================================================\n`);
}

webPush.setVapidDetails(
  'mailto:admin@loopers.campus',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export { vapidKeys };

export const sendNewOrderNotification = async (order) => {
  try {
    const activeSubscriptions = await AdminSubscription.find({});
    if (activeSubscriptions.length === 0) {
      console.log('[Push Service Info] No active admin push subscriptions registered.');
      return;
    }

    const customerName = order.user?.name || order.address?.name || 'Customer';
    const orderTotal = `₹${order.totalPrice.toFixed(0)}`;

    // Format address: line 1 only (e.g. house/room number + street)
    let firstLineAddress = 'Campus Delivery';
    if (order.address) {
      const house = order.address.houseNumber || '';
      const street = order.address.street || '';
      firstLineAddress = house && street ? `${house}, ${street}` : (house || street || 'Campus');
    }

    const payload = JSON.stringify({
      title: '🔔 New Order Received',
      body: `${customerName} • ${orderTotal}\n${firstLineAddress}`,
      orderId: order._id,
      icon: '/loopers.svg',
      badge: '/loopers.svg'
    });

    console.log(`[Push Service] Broadcasting new order push alert to ${activeSubscriptions.length} admin subscription(s)...`);

    const sendPromises = activeSubscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      return webPush.sendNotification(pushSubscription, payload)
        .catch(async (err) => {
          // If subscription has expired or has key mismatch (403, 404, 410 Gone)
          if ([403, 404, 410].includes(err.statusCode)) {
            console.log(`[Push Service Info] Pruning invalid/expired admin subscription endpoint (${err.statusCode}): ${sub.endpoint}`);
            await AdminSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error(`[Push Service Error] Failed to dispatch push:`, err.message);
          }
        });
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('[Push Service Error] Broadcast execution error:', err.message);
  }
};

/**
 * Generic customer push notification dispatcher
 */
export const sendCustomerOrderNotification = async (order, eventType = 'ORDER_ACCEPTED') => {
  try {
    if (!order || !order.user) {
      console.log('[Push Service Info] Cannot send customer push notification: order or user missing.');
      return;
    }

    const userId = order.user._id ? order.user._id : order.user;
    const activeSubscriptions = await UserSubscription.find({ user: userId });

    if (activeSubscriptions.length === 0) {
      console.log(`[Push Service Info] No active push subscriptions found for user ${userId}.`);
      return;
    }

    let title = 'Loopers';
    let body = 'Your order has been accepted and is now being packed.';
    let url = `/app/tracking/${order._id}`;

    if (eventType === 'ORDER_ACCEPTED' || eventType === 'Confirmed' || eventType === 'Packing') {
      title = 'Loopers';
      body = 'Your order has been accepted and is now being packed.';
      url = `/app/tracking/${order._id}`;
    } else if (eventType === 'Out for Delivery') {
      title = 'Loopers';
      body = 'Your order is out for delivery!';
      url = `/app/tracking/${order._id}`;
    } else if (eventType === 'Delivered') {
      title = 'Loopers';
      body = 'Your order has been delivered.';
      url = `/app/tracking/${order._id}`;
    } else if (eventType === 'Cancelled') {
      title = 'Loopers';
      body = 'Your order has been cancelled.';
      url = `/app/orders`;
    }

    const payload = JSON.stringify({
      title,
      body,
      orderId: order._id,
      type: eventType,
      url,
      icon: '/loopers.svg',
      badge: '/loopers.svg',
      timestamp: Date.now()
    });

    console.log(`[Push Service] Dispatching customer push notification (${eventType}) to ${activeSubscriptions.length} subscription(s) for user ${userId}...`);

    const sendPromises = activeSubscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      return webPush.sendNotification(pushSubscription, payload)
        .catch(async (err) => {
          if ([403, 404, 410].includes(err.statusCode)) {
            console.log(`[Push Service Info] Pruning invalid/expired user subscription endpoint (${err.statusCode}): ${sub.endpoint}`);
            await UserSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error(`[Push Service Error] Failed to send customer push:`, err.message);
          }
        });
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('[Push Service Error] Customer notification execution error:', err.message);
  }
};

