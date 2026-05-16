importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAXhgN85zD8-ojdNP2YK4X3Q0ccFnXLioQ",
  authDomain: "easylands-app.firebaseapp.com",
  projectId: "easylands-app",
  storageBucket: "easylands-app.firebasestorage.app",
  messagingSenderId: "1031195747972",
  appId: "1:1031195747972:web:1d954ad93885fd0b7844d1",
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
