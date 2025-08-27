// Define o nome e a versão do cache
const CACHE_NAME = "doc2text-cache-v1.2";

// Lista de arquivos essenciais para o app funcionar offline
// Usando caminhos relativos para maior compatibilidade
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./app.html",
  "./index.css",
  "./app.css",
  "./index.js",
  "./app.js",
  "./manifest.json",
  "./icon-192x192.png",
  "./icon-512x512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css",
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/fonts/bootstrap-icons.woff2?dd67030699838ea613ee6dbda90effa6", // Fonte dos ícones
];

// Evento de Instalação: Ocorre quando o SW é instalado pela primeira vez.
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Colocando arquivos no cache");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento de Ativação: Ocorre após a instalação e limpa caches antigos.
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativando...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Limpando cache antigo -", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Evento Fetch: Intercepta todas as requisições de rede.
self.addEventListener("fetch", (event) => {
  // Ignora requisições que não são GET (ex: POST para a API de OCR)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se a resposta estiver no cache, retorna ela.
      if (response) {
        return response;
      }
      // Se não, busca na rede.
      return fetch(event.request);
    })
  );
});
