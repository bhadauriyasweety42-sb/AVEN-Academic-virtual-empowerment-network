
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() || "You have a class reminder." };
  }

  const title = data.title || "AI Student Manager";
  const options = {
    body: data.body || "Your class starts soon.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url || "/academic-planner" },
    tag: "class-reminder",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/academic-planner",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windows) => {
        const existing = windows.find((window) => window.url.startsWith(self.location.origin));

        if (existing) {
          existing.navigate(targetUrl);
          return existing.focus();
        }

        return clients.openWindow(targetUrl);
      }
    )
  );
});
