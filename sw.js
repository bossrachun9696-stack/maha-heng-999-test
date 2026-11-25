// ===== มหาเฮง 999 · service worker (เปิดเร็ว) =====
// เปิดจากไฟล์ในเครื่องทันที แล้วโหลดตัวใหม่เก็บไว้เบื้องหลัง (เปิดครั้งหน้าได้ตัวใหม่)
// ข้อมูลจาก Supabase / Google ไม่เก็บ (ดึงสดเสมอ) · ออฟไลน์ = ใช้ไฟล์ในเครื่อง
// อัปเดตแอป: เปลี่ยนเลข VERSION ทุกครั้งที่อัปโหลดไฟล์ใหม่
const VERSION = 'mh-v1';
const SHELL = ['./', 'index.html', 'icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mh-v') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const nav = req.mode === 'navigate';
  const key = nav ? new Request(url.origin + url.pathname) : req;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(key);
    const net = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone()).catch(() => null);
      return res;
    });
    if (hit) { event.waitUntil(net.catch(() => null)); return hit; }
    try { return await net; }
    catch (err) {
      const any = nav ? (await cache.match('./') || await cache.match('index.html')) : null;
      if (any) return any;
      throw err;
    }
  })());
});
