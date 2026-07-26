// =========================================================
  // ✅ CONFIG FIJA — IDs y URL definitivos
  // =========================================================
  const FIXED_SHEET_ID = "1zPiB9X_1BC6cpGEQXNAipBjCYfF6BARyneTG3ncmQuY";
  const FIXED_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxP0sryHkJZ1P7mEGU7EhG1jh1OOcNzSUE8gPiDjLHBdZIzdjQoKANvIh_MIkewuA/exec";

  const $ = (id) => document.getElementById(id);

  const state = {
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
    const fase = ($("fFase")?.value || "").trim();
    const elast = ($("fElast")?.value || "").trim();
    const pago = ($("fPago")?.value || "").trim();
    const prox = ($("fControl")?.value || "").trim();
    const q = ($("fSearch")?.value || "").trim().toLowerCase();

    let rows = [...state.merged];

    if(tipo) rows = rows.filter(x => safeStr(x.tr["Tipo de Tratamiento"]).toLowerCase() === tipo.toLowerCase());
    if(fase) rows = rows.filter(x => safeStr(x.tr["Fase"]).toLowerCase() === fase.toLowerCase());
    if(elast) rows = rows.filter(x => safeStr(x.tr["Usa Elásticos"]).toLowerCase() === elast.toLowerCase());
    if(pago) rows = rows.filter(x => safeStr(x.fi["Estado Pago"]).toLowerCase() === pago.toLowerCase());

    if(prox){
      const hoy = new Date();
      const parseDate = (s)=>{
        if(!s) return null;
        const d = new Date(s);
        if(!isNaN(d)) return d;
        const m = String(s).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if(!m) return null;
        const dd = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
        return isNaN(dd) ? null : dd;
      };

      rows = rows.filter(x=>{
        const fc = safeStr(x.tr["Fecha Próximo Control"]);
        const dd = parseDate(fc);
        if(!dd) return false;
        const diffDays = (dd - hoy) / (1000*60*60*24);
        if(prox === "hoy") return diffDays >= -0.5 && diffDays < 0.5;
        if(prox === "7d") return diffDays >= -0.5 && diffDays <= 7.5;
        if(prox === "vencidos") return diffDays < -0.5;
        return true;
      });
    }

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
