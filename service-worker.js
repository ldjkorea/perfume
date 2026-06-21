const CACHE_NAME = 'fragrance-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css'
];

// 설치 단계: 필수 에셋 캐싱
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 네트워크 요청 가로채기 (네트워크가 안 되어도 앱이 켜지도록 설정)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
