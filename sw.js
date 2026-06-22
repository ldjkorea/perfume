/* 향수 공방 service worker
   - 설치 시 일부 에셋이 실패해도 죽지 않음 (Promise.allSettled)
   - 앱 화면(index.html)은 네트워크 우선 → 재배포하면 바로 새 버전이 보임
   - 그 외 에셋(폰트/CSS/아이콘)은 캐시 우선 + 런타임 캐싱 → 오프라인 동작
   - activate에서 옛 캐시 정리
   큰 변경을 배포할 땐 아래 CACHE 값을 v4, v5... 로 올려주면 확실하게 갱신됩니다. */
const CACHE = "fragrance-v3";
const PRELOAD = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 개별 캐싱: 하나가 실패해도 설치는 계속된다 (addAll의 all-or-nothing 회피)
    await Promise.allSettled(PRELOAD.map((url) => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // 앱 화면은 네트워크 우선 (재배포 즉시 반영), 실패하면 캐시 폴백
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  // 에셋은 캐시 우선 + 성공한 응답은 런타임 캐싱
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
