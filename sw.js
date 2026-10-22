/* Service worker · La casita de los 3 amigos
   Al actualizar el juego, sube el número de VERSION para que los móviles reciban los cambios. */
const VERSION = 'casita-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'logo-tigalma.png',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/environments/RoomEnvironment.js'];
const VOICES = ["coco-abrazo.mp3", "coco-animo-1.mp3", "coco-animo-2.mp3", "coco-animo-3.mp3", "coco-dificil.mp3", "coco-escuchamos.mp3", "coco-esperamos.mp3", "coco-final-juego.mp3", "coco-final.mp3", "coco-gracias-eri.mp3", "coco-gracias-pio.mp3", "coco-hola.mp3", "coco-lloviendo.mp3", "coco-nunca-rindes.mp3", "coco-pregunta-tejado.mp3", "coco-sigue-2.mp3", "coco-sigue-portada.mp3", "coco-solo.mp3", "coco-toque-1.mp3", "coco-toque-2.mp3", "coco-toque-3.mp3", "coco-tronco.mp3", "eri-final.mp3", "eri-gracias.mp3", "eri-hojas.mp3", "eri-me-atrevo.mp3", "eri-sigue-3.mp3", "eri-soy.mp3", "eri-toque-1.mp3", "eri-toque-2.mp3", "eri-toque-3.mp3", "eri-verguenza.mp3", "pio-bravo-eri.mp3", "pio-caida-1.mp3", "pio-caida-2.mp3", "pio-caida-3.mp3", "pio-como.mp3", "pio-genial.mp3", "pio-gracias-coco.mp3", "pio-hurra.mp3", "pio-mano.mp3", "pio-otra-1.mp3", "pio-otra-2.mp3", "pio-otra-3.mp3", "pio-paredes.mp3", "pio-pregunta-eri.mp3", "pio-pregunta-tronco-2.mp3", "pio-pregunta-tronco.mp3", "pio-ramitas.mp3", "pio-sigue-1.mp3", "pio-soy.mp3", "pio-tejado.mp3", "pio-toque-1.mp3", "pio-toque-2.mp3", "pio-toque-3.mp3"].map(f => 'voces/' + f);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));       // lo imprescindible
    await Promise.all(VOICES.map(u => c.add(u).catch(() => {})));      // las voces, sin que un fallo rompa la instalación
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
async function rangeFrom(resp, range){
  const buf = await resp.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [], s = +m[1] || 0, e = m[2] ? +m[2] : buf.byteLength - 1;
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': resp.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${s}-${e}/${buf.byteLength}`, 'Content-Length': e - s + 1 } });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
    if (req.mode === 'navigate'){                                      // la página: primero la red, y sin conexión la guardada
      try { const r = await fetch(req); if (r.ok) cache.put('index.html', r.clone()); return r; }
      catch (_) { return (await cache.match('index.html')) || (await cache.match('./')) || Response.error(); }
    }
    if (hit){
      const range = req.headers.get('range');
      return range ? rangeFrom(hit, range) : hit;
    }
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque') && !req.headers.get('range')) cache.put(req, r.clone());
      return r;
    } catch (_) { return Response.error(); }
  })());
});
