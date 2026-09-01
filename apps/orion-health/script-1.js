const APPS = {
  craniofacial: {
    title: "ORION Craniofacial Analysis",
    desc: "Cefalometría 2D · Prototipo en validación.",
    src: "./modules/craniofacial/index.html?embed=1&v=a52"
  },
  comunicaciones: {
    title: "ORION Comunicaciones Clínicas",
    desc: "Base de pacientes, mensajería y selección del paciente fuente.",
    src: "./modules/comunicaciones/index.html"
  },
  insumos: {
    title: "ORION Insumos",
    desc: "Gestión de insumos y material clínico.",
    src: "./modules/insumos/index.html"
  },
  cmf: {
    title: "ORION Clínico CMF",
    desc: "Documentos clínicos CMF.",
    src: "./modules/cmf/index.html"
  },
  endo: {
    title: "ORION Clínico ENDO",
    desc: "Módulo clínico de Endodoncia.",
    src: "./modules/endodoncia/index.html"
  },
  orto: {
    title: "ORION Ortodoncia",
    desc: "Mensajería y seguimiento clínico de Ortodoncia.",
    src: "./modules/ortodoncia/index.html"
  },
  odontopediatria: {
    title: "ORION Odontopediatría",
    desc: "Mensajería clínica y control pediátrico.",
    src: "./modules/odontopediatria/index.html"
  },
  armonizacion: {
    title: "ORION Armonización Orofacial",
    desc: "Aplicación autónoma para planificación, cálculo, mapa anatómico y registro por punto.",
    src: "./modules/armonizacion/index.html?v=1.5.1"
  }
};

const STORAGE_KEY = "orion_documento_paciente_activo_v1";
const STORAGE_TTL_MS = 2 * 60 * 60 * 1000;
const EVENT_SET = "ORION_SET_DOCUMENTO_PACIENTE";
const EVENT_GET = "ORION_GET_DOCUMENTO_PACIENTE";
const EVENT_CLEAR = "ORION_CLEAR_DOCUMENTO_PACIENTE";
const EVENT_SYNC = "ORION_DOCUMENTO_PACIENTE_SYNC";
const EVENT_NAVIGATE = "ORION_NAVIGATE_TO_APP";
const EVENT_SCROLL_MODULE_TOP = "ORION_SCROLL_MODULE_TOP";

const appFrame = document.getElementById("appFrame");
const currentAppTitle = document.getElementById("currentAppTitle");
const currentAppDesc = document.getElementById("currentAppDesc");
const syncNombre = document.getElementById("syncNombre");
const syncRut = document.getElementById("syncRut");
const syncEdad = document.getElementById("syncEdad");
const syncBadge = document.getElementById("syncBadge");
const menuButtons = Array.from(document.querySelectorAll(".menu-btn"));
const state = { currentApp: null };
let cephDirty = false;
const isCraniofacial = () => state.currentApp === "craniofacial";
const cephFrameHeight = () => Math.max(240, window.innerHeight - 32);
function canLeaveCraniofacial(){
  if(!isCraniofacial()) return true;
  let dirty = cephDirty;
  try{ dirty = appFrame.contentWindow?.ORION_CEPH?.hasUnsavedChanges?.() ?? dirty; }catch(_){}
  return !dirty || window.confirm("Cefalometría tiene cambios sin guardar. ¿Descartarlos y salir del módulo?");
}

let frameResizeObserver = null;
let frameMutationObserver = null;
let frameResizeTimer = null;

const targetOrigin = () => location.origin && location.origin !== "null" ? location.origin : "*";
const trustedFrameMessage = (event) => event.source === appFrame.contentWindow && (targetOrigin() === "*" || event.origin === location.origin);
const harmonizationDesktop = () => state.currentApp === "armonizacion" && window.innerWidth > 920;
const harmonizationFrameHeight = () => Math.max(720, Math.min(920, window.innerHeight - 110));

const normalize = (input = {}) => {
  const payload = input.payload && typeof input.payload === "object" ? input.payload : input;
  const clean = {
    nombre: String(payload.nombre || payload.nombreCompleto || payload.paciente || "").replace(/\s+/g," ").trim(),
    rut: String(payload.rut || payload.run || "").replace(/\s+/g,"").trim().toUpperCase(),
    edad: String(payload.edad || "").trim()
  };
  return (clean.nombre || clean.rut || clean.edad) ? clean : null;
};

function readPatient(){
  try{
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    const envelope = parsed.payload ? parsed : {payload:parsed,ts:Date.now()};
    if(envelope.ts && Date.now()-envelope.ts > STORAGE_TTL_MS){
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalize(envelope.payload);
  }catch(_){ return null; }
}

function writePatient(payload){
  const p = normalize(payload);
  if(!p){ clearPatient(); return null; }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({version:1,payload:p,ts:Date.now(),source:"portal"}));
  renderPatient(p);
  return p;
}

function clearPatient(){
  try{ sessionStorage.removeItem(STORAGE_KEY); }catch(_){}
  renderPatient(null);
}

function renderPatient(p){
  p = p || readPatient();
  syncNombre.textContent = p?.nombre || "Sin paciente";
  syncRut.textContent = p?.rut || "—";
  syncEdad.textContent = p?.edad || "—";
  syncNombre.classList.toggle("empty",!p?.nombre);
  syncRut.classList.toggle("empty",!p?.rut);
  syncEdad.classList.toggle("empty",!p?.edad);
  syncBadge.textContent = p ? "Documento listo" : "Sin paciente activo";
  syncBadge.classList.toggle("ready",!!p);
  syncBadge.classList.toggle("idle",!p);
}

function setActive(appKey){
  menuButtons.forEach(button => button.classList.toggle("active", button.dataset.app === appKey));
}

function resetPortalViewport(){
  try{ window.scrollTo({top:0,left:0,behavior:"auto"}); }catch(_){ window.scrollTo(0,0); }
  try{ appFrame.contentWindow?.scrollTo(0,0); }catch(_){}
}

function scrollFrameToViewportTop(behavior = "smooth"){
  requestAnimationFrame(() => {
    const top = Math.max(0, appFrame.getBoundingClientRect().top + window.scrollY - 4);
    try{ window.scrollTo({top,left:0,behavior}); }catch(_){ window.scrollTo(0,top); }
    try{ appFrame.contentWindow?.scrollTo(0,0); }catch(_){}
  });
}

function disconnectFrameObservers(){
  try{ frameResizeObserver?.disconnect(); }catch(_){}
  try{ frameMutationObserver?.disconnect(); }catch(_){}
  frameResizeObserver = null;
  frameMutationObserver = null;
  if(frameResizeTimer){ clearTimeout(frameResizeTimer); frameResizeTimer = null; }
}

function measureFrameHeight(){
  if(isCraniofacial()){
    appFrame.setAttribute("scrolling","no");
    appFrame.style.height = cephFrameHeight() + "px";
    return;
  }
  if(harmonizationDesktop()){
    appFrame.setAttribute("scrolling","no");
    appFrame.style.height = harmonizationFrameHeight() + "px";
    return;
  }

  try{
    const doc = appFrame.contentDocument;
    if(!doc) return;
    const body = doc.body;
    const html = doc.documentElement;
    if(!body || !html) return;

    const measured = Math.max(
      body.scrollHeight || 0,
      body.offsetHeight || 0,
      html.scrollHeight || 0,
      html.offsetHeight || 0
    );

    if(measured > 0){
      const minimum = window.innerWidth <= 640 ? 620 : 720;
      const nextHeight = Math.max(minimum, Math.ceil(measured));
      const currentHeight = Math.round(appFrame.getBoundingClientRect().height || 0);
      if(Math.abs(nextHeight - currentHeight) > 2){
        appFrame.style.height = nextHeight + "px";
      }
    }
  }catch(error){
    console.warn("No fue posible ajustar la altura del módulo.", error);
  }
}

function scheduleFrameMeasure(delay = 40){
  if(frameResizeTimer) clearTimeout(frameResizeTimer);
  frameResizeTimer = setTimeout(measureFrameHeight, delay);
}

function bindFrameAutoHeight(){
  disconnectFrameObservers();
  if(isCraniofacial()){
    measureFrameHeight();
    return;
  }

  if(harmonizationDesktop()){
    appFrame.setAttribute("scrolling","no");
    appFrame.style.height = harmonizationFrameHeight() + "px";
    return;
  }

  try{
    const doc = appFrame.contentDocument;
    if(!doc?.documentElement || !doc.body) return;

    appFrame.setAttribute("scrolling","no");
    appFrame.style.height = (window.innerWidth <= 640 ? 620 : 720) + "px";

    if("ResizeObserver" in window){
      frameResizeObserver = new ResizeObserver(() => scheduleFrameMeasure(20));
      frameResizeObserver.observe(doc.documentElement);
      frameResizeObserver.observe(doc.body);
    }

    frameMutationObserver = new MutationObserver(() => scheduleFrameMeasure(30));
    frameMutationObserver.observe(doc.body, {
      childList:true,
      subtree:true,
      attributes:true,
      characterData:true
    });

    ["input","change","click","transitionend"].forEach(eventName => {
      doc.addEventListener(eventName, () => scheduleFrameMeasure(60), true);
    });

    measureFrameHeight();
    [120, 350, 800, 1600, 3000].forEach(delay => setTimeout(measureFrameHeight, delay));
  }catch(error){
    console.warn("No fue posible activar la altura automática del módulo.", error);
  }
}

function showRouteSelector(){
  if(!canLeaveCraniofacial()) return;
  cephDirty = false;
  document.body.classList.remove("craniofacial-active");
  disconnectFrameObservers();
  state.currentApp = null;
  setActive(null);
  document.body.classList.remove("module-selected");
  document.body.classList.add("route-selector-mode");
  currentAppTitle.textContent = "Módulo ORION";
  currentAppDesc.textContent = "Selecciona una ruta para comenzar";
  appFrame.src = "about:blank";
  appFrame.style.height = "620px";
  resetPortalViewport();
}

function loadApp(appKey){
  const app = APPS[appKey];
  if(!app) return;
  if(!canLeaveCraniofacial()) return;
  cephDirty = false;
  state.currentApp = appKey;
  document.body.classList.toggle("craniofacial-active",isCraniofacial());
  appFrame.title = app.title;
  currentAppTitle.textContent = app.title;
  currentAppDesc.textContent = app.desc;
  setActive(appKey);
  disconnectFrameObservers();
  document.body.classList.remove("route-selector-mode");
  document.body.classList.add("module-selected");
  resetPortalViewport();
  appFrame.style.height = isCraniofacial() ? cephFrameHeight() + "px" : harmonizationDesktop() ? harmonizationFrameHeight() + "px" : (window.innerWidth <= 640 ? 620 : 720) + "px";
  appFrame.src = app.src;
}

function sendPatient(target){
  if(!target) return;
  target.postMessage({type:EVENT_SYNC,payload:readPatient()},targetOrigin());
}

function sendActive(){ sendPatient(appFrame.contentWindow); }

menuButtons.forEach(button => button.addEventListener("click",() => loadApp(button.dataset.app)));
document.getElementById("btnChangeModule").addEventListener("click",showRouteSelector);
document.getElementById("btnGoCMF").addEventListener("click",() => loadApp("cmf"));
document.getElementById("btnOpenStandalone").addEventListener("click",() => {
  const app = APPS[state.currentApp];
  if(app) window.open(app.src,"_blank","noopener");
});
document.getElementById("btnReloadApp").addEventListener("click",() => {
  if(!state.currentApp) return;
  if(!canLeaveCraniofacial()) return;
  cephDirty = false;
  disconnectFrameObservers();
  scrollFrameToViewportTop("auto");
  const app = APPS[state.currentApp];
  if(!app) return;
  const separator = app.src.includes("?") ? "&" : "?";
  appFrame.src = `${app.src}${separator}reload=${Date.now()}`;
});
document.getElementById("btnClearPaciente").addEventListener("click",() => { clearPatient(); sendActive(); });

appFrame.addEventListener("load",() => {
  if(!state.currentApp) return;
  try{ appFrame.contentWindow?.scrollTo(0,0); }catch(_){}
  bindFrameAutoHeight();
  setTimeout(sendActive,180);
});

window.addEventListener("resize",() => scheduleFrameMeasure(80));

window.addEventListener("message",event => {
  if(!trustedFrameMessage(event)) return;
  const msg = event.data || {};
  if(!msg || typeof msg !== "object") return;
  switch(msg.type){
    case "ORION_CEPH_DIRTY":
      if(isCraniofacial() && typeof msg.dirty === "boolean") cephDirty = msg.dirty;
      break;
    case EVENT_SET:
    case "ORION_SET_RECETA_PACIENTE":
      writePatient(msg.payload);
      loadApp("cmf");
      break;
    case EVENT_GET:
    case "ORION_GET_RECETA_PACIENTE":
      sendPatient(event.source);
      break;
    case EVENT_CLEAR:
    case "ORION_CLEAR_RECETA_PACIENTE":
      clearPatient();
      sendActive();
      break;
    case EVENT_NAVIGATE:
      if(APPS[String(msg.appKey || "").trim()]) loadApp(String(msg.appKey).trim());
      break;
    case EVENT_SCROLL_MODULE_TOP:
      scrollFrameToViewportTop("smooth");
      break;
    case "ORION_MODULE_READY":
      if(msg.module === "armonizacion"){
        bindFrameAutoHeight();
        sendActive();
      }
      break;
  }
});

if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
renderPatient(readPatient());
showRouteSelector();
