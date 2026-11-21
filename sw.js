// LAX Landside Schedule — service worker.
// Only shows notifications. It does NOT cache anything, so app updates still load right away.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'LAX Landside', body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    // tell any open copy of the app to refresh (updates the red number on Chat right away)
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    wins.forEach(c => c.postMessage({ type: 'push', kind: d.kind }));

    let title = d.title || 'LAX Landside', body = d.body || '', count = 1;
    if (d.kind === 'chat') {
      // stack chat into ONE notification: "Chat · 3 new messages" + the latest line
      const old = await self.registration.getNotifications({ tag: 'chat' });
      count = (old[0]?.data?.count || 0) + 1;
      body = `${d.title}: ${d.body}`;
      title = count > 1 ? `Chat · ${count} new messages` : 'Chat · LAX Landside';
    }
    await self.registration.showNotification(title, {
      body, tag: d.tag, renotify: !!d.tag, icon: 'icon-v2-192.png', badge: 'icon-v2-192.png',
      data: { url: d.url || './', count },
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if (c.url.startsWith(self.registration.scope)) { await c.focus(); return c.navigate(url); }
    return self.clients.openWindow(url);
  })());
});
