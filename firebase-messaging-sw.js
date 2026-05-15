importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBbVbjoP-Kehl6LAky4a5HOM3jl8dWElJQ",
  authDomain: "easylife-8b21d.firebaseapp.com",
  projectId: "easylife-8b21d",
  storageBucket: "easylife-8b21d.firebasestorage.app",
  messagingSenderId: "878219518561",
  appId: "1:878219518561:android:76fc100a00903529290020",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Easylands";
  const body  = payload.notification?.body  || "You have a new notification";
  const icon  = payload.notification?.image || "/easylands-icon-192.png";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/easylands-icon-96.png",
    tag: "easylands-fcm",
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: payload.data || { url: "/" },
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss"  },
    ],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
