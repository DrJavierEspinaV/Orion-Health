// =========================================================
  // ✅ CONFIG FIJA — IDs y URL definitivos
  // =========================================================
  const FIXED_SHEET_ID = "1FBUfnVmfbyGKoXAp2-SaOi6kh8OlSeLUBtZpAzshrvc";
  const FIXED_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby-WCSI8ZaE50O_5EvZOQOkFvpq47wqQoK3nm0kUg3NBac7cx6Jbj9Cbsne86nyCUY0/exec";

  const $ = (id) => document.getElementById(id);

  function getToken_(){ return ($('writeToken')?.value || '').trim(); }

  const state = {
    _contacted: new Set(),
    pacientes: [],
    tratamiento: [],
    finanzas: [],
    merged: [],
    filtered: []
  };

  // ------------------------------
  // Helpers
  // ------------------------------
  function normRUN(v){ return String(v||"").toUpperCase().replace(/[^0-9K]/g,""); }
  function fmtRUN(v){
    const r = normRUN(v); if(!r) return "";
    const body = r.slice(0,-1); const dv = r.slice(-1);
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots}-${dv}`;
  }
  function safeStr(v){ return (v===null||v===undefined) ? "" : String(v).trim(); }
  function escapeHtml_(s){ return escapeHtml(s); }
  function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,"&quot;"); }

  function setStatus(msg, kind=""){
    const el = $("status");
    if(!el) return;
    el.textContent = msg || "";
    el.className = "small " + (kind==="ok"?"ok":kind==="bad"?"bad":kind==="warn"?"warn":"");
  }
  function setWriteStatus(msg, kind=""){
    const el = $("writeStatus");
    if(!el) return;
    el.textContent = msg || "";
    el.className = "small " + (kind==="ok"?"ok":kind==="bad"?"bad":kind==="warn"?"warn":"");
  }

  // ------------------------------
  // JSONP caller (para HTML local sin CORS)
  // ------------------------------
  function jsonpCall(params){
    return new Promise((resolve, reject) => {
      const cb = "cb_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");

      window[cb] = (data) => {
        try { resolve(data); }
        finally {
          delete window[cb];
          script.remove();
        }
      };

      const url = new URL(FIXED_WEBAPP_URL);
      Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
      url.searchParams.set("callback", cb);

      script.onerror = () => {
        delete window[cb];
        script.remove();
        reject(new Error("No se pudo conectar al WebApp (URL/permisos)."));
      };
      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  async function ping(){
    setStatus("Probando conexión…", "");
    try{
      const token = ($("writeToken")?.value || "").trim();
      const r = await jsonpCall({ action:"ping", token });
      if(!r || !r.ok) throw new Error(r?.error || "Ping falló");
      setStatus("Ping OK ✅ (WebApp responde)", "ok");
    }catch(e){
      console.error(e);
      setStatus("Ping falló ❌ (revisa despliegue/permisos/token)", "bad");
    }
  }

  // ------------------------------
  // Cargar datos (Apps Script: getAll)
  // ------------------------------
  async function cargarTodo(){
    setStatus("Cargando datos desde Apps Script…", "");
    try{
      const token = ($("writeToken")?.value || "").trim();
      const pacSheet  = ($("sheetPac")?.value || "PACIENTES").trim();
      const tratSheet = ($("sheetTrat")?.value || "TRATAMIENTO").trim();
      const finSheet  = ($("sheetFin")?.value || "FINANZAS").trim();

      const r = await jsonpCall({
        action: "getAll",
        token,
        pacSheet,
        tratSheet,
        finSheet
      });

      if(!r || !r.ok) throw new Error(r?.error || "Error getAll");

      state.pacientes = Array.isArray(r.pacientes) ? r.pacientes : [];
      state.tratamiento = Array.isArray(r.tratamiento) ? r.tratamiento : [];
      state.finanzas = Array.isArray(r.finanzas) ? r.finanzas : [];

      const idxT = new Map(state.tratamiento.map(row => [normRUN(row.RUN || row.RUT || row.Run || row.Rut), row]));
      const idxF = new Map(state.finanzas.map(row => [normRUN(row.RUN || row.RUT || row.Run || row.Rut), row]));

      state.merged = state.pacientes.map(pac => {
        const run = normRUN(pac.RUN || pac.RUT || pac.Run || pac.Rut);
        return { pac, tr: (idxT.get(run) || {}), fi: (idxF.get(run) || {}), run };
      });

      aplicarFiltros();

      // abre resultados automáticamente solo al cargar (queda ocultable después)
      $("resultsBox").open = true;

      setStatus(`Datos cargados ✅ (Pacientes: ${state.pacientes.length})`, "ok");
    }catch(e){
      console.error(e);
      setStatus("Error al cargar ❌. Si ping OK pero getAll falla: revisa nombres de hojas o permisos del script.", "bad");
    }
  }

  // ------------------------------
  // Filtros
  // ------------------------------
  function aplicarFiltros(){
    const tipo = ($("fTipo")?.value || "").trim();
    const riesgo = ($("fRiesgo")?.value || "").trim();
    const conducta = ($("fConducta")?.value || "").trim();
    const pago = ($("fPago")?.value || "").trim();
    const prox = ($("fControl")?.value || "").trim();
    const q = ($("fSearch")?.value || "").trim().toLowerCase();

    let rows = [...state.merged];

    if(tipo) rows = rows.filter(x => safeStr(x.tr["Tipo de Control"]).toLowerCase() === tipo.toLowerCase());
    if(riesgo) rows = rows.filter(x => safeStr(x.tr["Riesgo Caries"]).toLowerCase() === riesgo.toLowerCase());
    if(conducta) rows = rows.filter(x => safeStr(x.tr["Conducta"]).toLowerCase() === conducta.toLowerCase());

    // Estado Pago (simple): "Al día" = saldo 0 ; "Atrasado" = saldo>0 y vencimiento pasado
    if(pago){
      rows = rows.filter(x=>{
        const saldo = moneyNum_(x.fi["Saldo"]);
        const venc = parseAnyDate_(x.fi["Próximo Vencimiento"]);
        const today = new Date(); today.setHours(0,0,0,0);
        if(pago.toLowerCase()==="al día") return saldo <= 0;
        if(pago.toLowerCase()==="atrasado") return (saldo > 0) && (venc && venc < today);
        return true;
      });
    }

    // Próximo control
    if(prox){
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      rows = rows.filter(x=>{
        const dd = parseAnyDate_(x.tr["Fecha Próximo Control"]);
        if(!dd) return false;
        dd.setHours(0,0,0,0);

        const diffDays = (dd - hoy) / (1000*60*60*24);
        if(prox === "hoy") return diffDays >= 0 && diffDays < 1;
        if(prox === "7d") return diffDays >= 0 && diffDays <= 7;
        if(prox === "vencidos") return diffDays < 0;
        return true;
      });
    }

    // Búsqueda
    if(q){
      rows = rows.filter(x=>{
        const nombre = `${safeStr(x.pac.Nombre)} ${safeStr(x.pac.Apellido)}`.toLowerCase();
        const runFmt = fmtRUN(x.run).toLowerCase();
        return nombre.includes(q) || runFmt.includes(q) || x.run.includes(q);
      });
    }

    state.filtered = rows;
    $("count").textContent = String(rows.length);
    renderTabla();
  }

  // ------------------------------
  // Tabla + acciones
  // ------------------------------
  
  
  function markContactedLocal_(run, canal, tipo, plantilla, obs){
    state.comms = state.comms || [];
    state.comms.push({
      Fecha: new Date().toISOString(),
      RUN: run,
      Destino: "tutor",
      Canal: canal || "Resultados",
      TipoMensaje: tipo || "Recall",
      Plantilla: plantilla || "CONTACTADO",
      Estado: "CONTACTADO",
      Observación: obs || ""
    });
  }

function getCommStatusByRun_(run){
    const list = state.comms || state.comunicaciones || [];
    if(!Array.isArray(list) || !list.length) return "";
    let last = "";
    for(const r of list){
      const rr = safeStr(r.RUN || r.Run || r.run);
      if(rr !== run) continue;
      const st = safeStr(r.Estado || r.estado);
      if(st) last = st;
    }
    return String(last||"").toUpperCase();
  }
