  function renderRecall(items){
    const tb = $("recallBody");
    const vencidos = items.filter(x=>x.Estado==="VENCIDO").length;
    const prox = items.filter(x=>x.Estado==="PRÓXIMO").length;
    $("kpiMix").textContent = `${vencidos} / ${prox}`;

    tb.innerHTML = "";
    if(!items.length){
      tb.innerHTML = `<tr><td colspan="8" class="small" style="padding:12px">Sin vencidos ni próximos (30 días).</td></tr>`;
      return;
    }

    const rows = items.map(x=>{
      const estadoClass = x.Estado==="VENCIDO" ? "bad" : "warn";
      const nombre = `${safeStr(x.Nombre)} ${safeStr(x.Apellido)}`.trim() || "(sin nombre)";
      const run = safeStr(x.RUN);
      const tipo = safeStr(x.TipoControl);
      const riesgo = safeStr(x.Riesgo);
      const fecha = safeStr(x.FechaControl);
      const comp = x.Computado ? ` <span class="pill" title="Fecha calculada por riesgo">AUTO</span>` : "";
      const contactPill = x.Contactado
        ? `<span class="ok pill" style="font-weight:900">CONTACTADO</span>`
        : `<span class="warn pill" style="font-weight:900">PENDIENTE</span>`;

      return `<tr>
        <td><span class="${estadoClass} pill" style="font-weight:900">${x.Estado}</span></td>
        <td>${fecha}${comp}</td>
        <td>${escapeHtml_(nombre)}</td>
        <td class="mono">${escapeHtml_(run)}</td>
        <td>${escapeHtml_(tipo)}</td>
        <td>${escapeHtml_(riesgo)}</td>
        <td style="white-space:nowrap">
          <button class="btn2" data-run="${escapeAttr_(run)}" data-act="wa" type="button">WhatsApp</button>
          <button class="btnGhost" data-run="${escapeAttr_(run)}" data-act="mk" type="button">Marcar</button>
        </td>
        <td>${contactPill}</td>
      </tr>`;
    }).join("");

    tb.innerHTML = rows;

    tb.querySelectorAll("button").forEach(b=>{
      const run = b.dataset.run;
      const act = b.dataset.act;
      if(act==="wa"){
        b.onclick = ()=>accionWhatsApp(run, { fromDash:true });
      }else if(act==="mk"){
        b.onclick = async ()=>{
          await logComunicacion_(run, "Dashboard", "Recall", "CONTACTADO", "CONTACTADO", "Marcado manual");
          loadDashboard();
        };
      }
    });
  }

  function escapeAttr_(s){ return escapeAttr(s); }

  async function logComunicacion_(run, canal, tipoMsg, plantilla, estado, observacion){
    try{
      if(!$("logCom") || !$("logCom").checked) return;

      const token = getToken_();
      if(!token){
        setStatus("No puedo registrar comunicación: falta TOKEN.", "bad");
        return;
      }

      const destino = ($("destinoMsg")?.value || "").trim();
      const comSheet = ($("sheetCom")?.value || "").trim();
      const res = await jsonpCall({
        action:"logComunicacion",
        token,
        run,
        destino,
        canal,
        tipo: tipoMsg || "",
        plantilla: plantilla || "",
        estado: estado || "",
        observacion: observacion || "",
        ...(comSheet ? { comSheet } : {})
      });

      if(!res || res.ok !== true){
        setStatus("No se registró en COMUNICACIONES (token/hoja/permisos).", "warn");
      }
    }catch(e){
      console.error(e);
      setStatus("Error registrando comunicación (revisa token/implementación).", "warn");
    }
  }

  function init(){
    $("tabMensajeria").onclick = ()=>showTab("mens");
    $("tabIngreso").onclick = ()=>showTab("ing");
    $("tabDashboard").onclick = ()=>showTab("dash");

    $("btnPing").onclick = ping;
    $("btnLoad").onclick = cargarTodo;
    $("btnApply").onclick = aplicarFiltros;
    $("btnDash").onclick = loadDashboard;

    $("btnClear").onclick = ()=>{
      $("fTipo").value = "";
      $("fRiesgo").value = "";
      $("fConducta").value = "";
      $("fPago").value = "";
      $("fControl").value = "";
      $("fSearch").value = "";
      aplicarFiltros();
    };

    $("btnPreview").onclick = ()=>{ $("preview").value = getPlantilla($("tipoMsg").value); };
    $("btnCopy").onclick = ()=>{ copyToClipboardSafe($("preview").value||"").then(ok=>setStatus(ok ? "Vista previa copiada ✅" : "No se pudo copiar (bloqueo del navegador).", ok ? "ok" : "warn")); };
    $("tipoMsg").onchange = ()=>{ $("preview").value = getPlantilla($("tipoMsg").value); };

    $("btnGuardarPaciente").onclick = guardarPaciente;

    $("dlgClose").onclick = ()=>$("dlgFicha").close();
    $("dlgPrint").onclick = () => printFicha_();

    $("preview").value = getPlantilla($("tipoMsg").value);
    setStatus("Listo. 1) Ping  2) Cargar datos  3) Filtra y envía a apoderado/paciente.", "warn");
    setWriteStatus("Listo para guardar pacientes.", "");
  }
  document.addEventListener("DOMContentLoaded", init);
