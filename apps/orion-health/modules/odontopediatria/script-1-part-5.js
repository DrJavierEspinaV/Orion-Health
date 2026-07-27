  async function guardarPaciente(){
    const token = ($("writeToken")?.value || "").trim();
    if(!token) return setWriteStatus("Falta token.", "bad");

    const pacSheet  = ($("sheetPac")?.value || "PACIENTES").trim();
    const tratSheet = ($("sheetTrat")?.value || "TRATAMIENTO").trim();
    const finSheet  = ($("sheetFin")?.value || "FINANZAS").trim();

    const payload = {
      run: ($("fRun")?.value || "").trim(),
      nombre: ($("fNombre")?.value || "").trim(),
      apellido: ($("fApellido")?.value || "").trim(),
      whatsapp: ($("fWa")?.value || "").trim(),
      email: ($("fEmail")?.value || "").trim(),
      edad: ($("fEdad")?.value || "").trim(),

      tutor: ($("fTutor")?.value || "").trim(),
      tutorWhatsapp: ($("fTutorWa")?.value || "").trim(),
      tutorEmail: ($("fTutorEmail")?.value || "").trim(),
      parentesco: ($("fParentesco")?.value || "").trim(),

      riesgoCaries: ($("fRiesgoIn")?.value || "").trim(),
      conducta: ($("fConductaIn")?.value || "").trim(),
      tipoControl: ($("fTipoControlIn")?.value || "").trim(),
      fechaControl: ($("fFechaControlIn")?.value || "").trim(),

      consClin: ($("fConsClin")?.value || "Sí").trim(),
      consPromo: ($("fConsPromo")?.value || "No").trim()
    };

    setWriteStatus("Guardando…", "");
    try{
      const r = await jsonpCall({
        action: "upsertPaciente",
        token,
        pacSheet,
        tratSheet,
        finSheet,
        payload: JSON.stringify(payload)
      });

      if(!r || !r.ok) throw new Error(r?.error || "Error al guardar");

      setWriteStatus(`Guardado ✅ (${r.run || "RUN OK"})`, "ok");
      await cargarTodo();
    }catch(e){
      console.error(e);
      setWriteStatus("No se pudo guardar ❌ (revisa token / columnas / permisos).", "bad");
    }
  }

  // ------------------------------
  // Tabs
  // ------------------------------
  function showTab(tab){
    const isMens = (tab==="mens");
    const isIng  = (tab==="ing");
    const isDash = (tab==="dash");
    $("mensLayout").style.display = isMens ? "" : "none";
    $("ingresoCard").style.display = isIng ? "" : "none";
    $("dashCard").style.display = isDash ? "" : "none";
    $("tabMensajeria").classList.toggle("active", isMens);
    $("tabIngreso").classList.toggle("active", isIng);
    $("tabDashboard").classList.toggle("active", isDash);
    if(isDash) loadDashboard();
  }

  
  
  function fmtDateCL(v){
    if(!v) return "";
    try{
      // Apps Script envía fechas como ISO string en JSON
      if(typeof v === "string"){
        const s = v.trim();
        if(!s) return "";
        // ISO
        if(/^\d{4}-\d{2}-\d{2}T/.test(s)){
          const d = new Date(s);
          if(!isNaN(d)) return d.toLocaleDateString("es-CL");
        }
        // YYYY-MM-DD
        if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
          const d = new Date(s + "T00:00:00");
          if(!isNaN(d)) return d.toLocaleDateString("es-CL");
        }
        // DD/MM/YYYY
        if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
        // fallback
        const d = new Date(s);
        if(!isNaN(d)) return d.toLocaleDateString("es-CL");
        return s;
      }
      // Date object (por si acaso)
      if(Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) return v.toLocaleDateString("es-CL");
      return String(v);
    }catch(_){
      return String(v||"");
    }
  }


  function inferPago(estadoPago, saldo){
    const st = (estadoPago||"").toString().trim();
    const n = Number(String(saldo||"").replace(/[^\d\-]/g,"")) || 0;
    if(st) return st;
    if(n > 0) return "Pendiente";
    return "";
  }


  function pagoLabel(estadoPago, saldo){
    const st = inferPago(estadoPago, saldo);
    const n = Number(String(saldo||"").replace(/[^\d\-]/g,"")) || 0;
    if(!st && !n) return "—";
    if(n > 0) return `${st || "Pendiente"} · ${clp(n)}`;
    return st || "—";
  }


  function parseAnyDate_(v){
    if(!v) return null;
    if(Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) return v;
    const s = String(v).trim();
    if(!s) return null;

    if(/^\d{4}-\d{2}-\d{2}/.test(s)){
      const d = new Date(s.includes("T") ? s : (s + "T00:00:00"));
      return isNaN(d) ? null : d;
    }
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m){
      const d = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
      return isNaN(d) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  function moneyNum_(v){
    return Number(String(v||"").replace(/[^\d\-]/g,"")) || 0;
  }

  function dueStatus(saldo, venc){
    const n = moneyNum_(saldo);
    const d = parseAnyDate_(venc);
    const today = new Date(); today.setHours(0,0,0,0);
    const in7 = new Date(today.getTime() + 7*24*60*60*1000);

    if(n <= 0) return { cls:"pillOk", label:"PAGADO" };
    if(d && d < today) return { cls:"pillBad", label:"VENCIDO" };
    if(d && d <= in7) return { cls:"pillWarn", label:"POR VENCER" };
    return { cls:"pillWarn", label:"PENDIENTE" };
  }

  function pillLite(cls, txt){
    return `<span class="pillLite ${cls}">${escapeHtml_(txt)}</span>`;
  }

  function tagLite(txt){
    return `<span class="pillLite">${escapeHtml_(txt)}</span>`;
  }

function clp(n){
    try{
      return new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Number(n||0));
    }catch(_){
      return "$" + String(n||0);
    }
  }

  function renderForecast(rows){
    const by = {};
    (rows||[]).forEach(r=>{ by[String(r.horizon)] = r; });
    const r30 = by["30"] || {};
    const r60 = by["60"] || {};
    const r90 = by["90"] || {};

    $("kpiF30").textContent = clp(r30.total || 0);
    $("kpiF60").textContent = clp(r60.total || 0);
    $("kpiF90").textContent = clp(r90.total || 0);

    $("kpiF30d").textContent = `Cobranza: ${clp(r30.cobranza||0)} · Controles: ${r30.controles||0} (${clp(r30.controlesEstimados||0)})`;
    $("kpiF60d").textContent = `Cobranza: ${clp(r60.cobranza||0)} · Controles: ${r60.controles||0} (${clp(r60.controlesEstimados||0)})`;
    $("kpiF90d").textContent = `Cobranza: ${clp(r90.cobranza||0)} · Controles: ${r90.controles||0} (${clp(r90.controlesEstimados||0)})`;
  }

  async function loadDashboard(){
    $("dashHint").textContent = "Actualizando…";
    try{
      const token = getToken_();
      const finSheet  = ($("sheetFin")?.value || "FINANZAS_KIDS").trim();
      const tratSheet = ($("sheetTrat")?.value || "TRATAMIENTO_KIDS").trim();
      const pacSheet  = ($("sheetPac")?.value || "PACIENTES_KIDS").trim();
      const risk = ($("dashRisk")?.value || "").trim();
      const valorControl = ($("valorControl")?.value || "0").trim();

      const rDash = await jsonpCall({ action:"getDashboard", token, finSheet, tratSheet });
      if(!rDash?.ok) throw new Error(rDash?.error || "No pude leer dashboard");

      $("kpiDeuda").textContent   = clp(rDash.dashboard.deudaTotal);
      $("kpiVence30").textContent = clp(rDash.dashboard.vencimientos30);
      $("kpiCtrl30").textContent  = String(rDash.dashboard.proximosControles30);

      const rRecall = await jsonpCall({ action:"listRecallSmart", token, pacSheet, tratSheet, comSheet:"COMUNICACIONES_KIDS", days:"30", risk });
      if(!rRecall?.ok) throw new Error(rRecall?.error || "No pude leer recall");
      renderRecall(rRecall.items || []);

      const rF = await jsonpCall({ action:"getForecast", token, finSheet, tratSheet, horizons:"30,60,90", valorControl });
      if(rF?.ok) renderForecast(rF.forecast || []);

      $("dashHint").textContent = "OK ✅";
    }catch(e){
      console.error(e);
      $("dashHint").textContent = "Error: " + (e?.message || e);
    }
  }
