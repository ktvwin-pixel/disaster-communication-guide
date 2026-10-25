/* Immutable release cache. Incident input never enters this cache. */
const RELEASE='2026.10.25-r1';
const CACHE_NAME='disaster-comm-guide-v9-'+RELEASE;
const PREFIX='disaster-comm-guide-';
const scope=new URL(self.registration.scope);
const paths=['index.html','styles.css','content.js','engine.js','app.js','manifest.webmanifest','logo-white.png'];
const urlFor=path=>new URL(path+'?release='+RELEASE,scope).href;
const ASSETS=paths.map(urlFor);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&!key.startsWith(PREFIX+'v9-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const path=url.pathname.slice(scope.pathname.length);
  if(event.request.mode==='navigate'&&(path===''||path==='index.html')){
    event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(urlFor('index.html'))).then(cached=>cached||fetch(event.request)));return;
  }
  if(!paths.includes(path))return;
  // Match explicit release exactly; retain prior v9 caches for already-open tabs.
  const key=url.searchParams.has('release')?event.request:urlFor(path);
  event.respondWith(caches.match(key).then(cached=>cached||fetch(event.request)));
});
