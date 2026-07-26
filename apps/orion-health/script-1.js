const APPS = {
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
      }
    };

    const STORAGE_KEY = "orion_documento_paciente_activo_v1";
    const STORAGE_TTL_MS = 2 * 60 * 60 * 1000;
    const EVENT_SET = "ORION_SET_DOCUMENTO_PACIENTE";
    const EVENT_GET = "ORION_GET_DOCUMENTO_PACIENTE";
    const EVENT_CLEAR = "ORION_CLEAR_DOCUMENTO_PACIENTE";
    const EVENT_SYNC = "ORION_DOCUMENTO_PACIENTE_SYNC";
    const EVENT_NAVIGATE = "ORION_NAVIGATE_TO_APP";

    const appFrame = document.getElementById("appFrame");
    const currentAppTitle = document.getElementById("currentAppTitle");
    const currentAppDesc = document.getElementById("currentAppDesc");
    const syncNombre = document.getElementById("syncNombre");
    const syncRut = document.getElementById("syncRut");
    const syncEdad = document.getElementById("syncEdad");
    const syncBadge = document.getElementById("syncBadge");
    const menuButtons = Array.from(document.querySelectorAll(".menu-btn"));
    const state = { currentApp: "comunicaciones" };

    const targetOrigin = () => location.origin && location.origin !== "null" ? location.origin : "*";
    const trustedFrameMessage = (event) => event.source === appFrame.contentWindow && (targetOrigin() === "*" || event.origin === location.origin);
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
        const raw=sessionStorage.getItem(STORAGE_KEY); if(!raw) return null;
        const parsed=JSON.parse(raw); const envelope=parsed.payload?parsed:{payload:parsed,ts:Date.now()};
        if(envelope.ts && Date.now()-envelope.ts>STORAGE_TTL_MS){sessionStorage.removeItem(STORAGE_KEY);return null;}
        return normalize(envelope.payload);
      }catch(_){return null;}
    }
    function writePatient(payload){
      const p=normalize(payload); if(!p){clearPatient();return null;}
      sessionStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,payload:p,ts:Date.now(),source:"portal"}));
      renderPatient(p); return p;
    }
    function clearPatient(){try{sessionStorage.removeItem(STORAGE_KEY)}catch(_){} renderPatient(null);}
    function renderPatient(p){
      p=p||readPatient();
      syncNombre.textContent=p?.nombre||"Sin paciente"; syncRut.textContent=p?.rut||"—"; syncEdad.textContent=p?.edad||"—";
      syncNombre.classList.toggle("empty",!p?.nombre); syncRut.classList.toggle("empty",!p?.rut); syncEdad.classList.toggle("empty",!p?.edad);
      syncBadge.textContent=p?"Documento listo":"Sin paciente activo"; syncBadge.classList.toggle("ready",!!p); syncBadge.classList.toggle("idle",!p);
    }
    function setActive(appKey){menuButtons.forEach(b=>b.classList.toggle("active",b.dataset.app===appKey));}
    function loadApp(appKey){const app=APPS[appKey];if(!app)return;state.currentApp=appKey;currentAppTitle.textContent=app.title;currentAppDesc.textContent=app.desc;setActive(appKey);appFrame.src=app.src;}
    function sendPatient(target){if(!target)return;target.postMessage({type:EVENT_SYNC,payload:readPatient()},targetOrigin());}
    function sendActive(){sendPatient(appFrame.contentWindow);}

    menuButtons.forEach(btn=>btn.addEventListener("click",()=>loadApp(btn.dataset.app)));
    document.getElementById("btnGoCMF").addEventListener("click",()=>loadApp("cmf"));
    document.getElementById("btnOpenStandalone").addEventListener("click",()=>window.open(APPS[state.currentApp]?.src||"","_blank","noopener"));
    document.getElementById("btnReloadApp").addEventListener("click",()=>{const src=appFrame.src;appFrame.src=src;});
    document.getElementById("btnClearPaciente").addEventListener("click",()=>{clearPatient();sendActive();});
    appFrame.addEventListener("load",()=>setTimeout(sendActive,180));

    window.addEventListener("message",event=>{
      if(!trustedFrameMessage(event)) return;
      const msg=event.data||{}; if(!msg||typeof msg!=="object") return;
      switch(msg.type){
        case EVENT_SET:
        case "ORION_SET_RECETA_PACIENTE": writePatient(msg.payload); loadApp("cmf"); break;
        case EVENT_GET:
        case "ORION_GET_RECETA_PACIENTE": sendPatient(event.source); break;
        case EVENT_CLEAR:
        case "ORION_CLEAR_RECETA_PACIENTE": clearPatient(); sendActive(); break;
        case EVENT_NAVIGATE: if(APPS[String(msg.appKey||"").trim()]) loadApp(String(msg.appKey).trim()); break;
      }
    });

    if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
    renderPatient(readPatient());
    loadApp("comunicaciones");
