  function renderFichaPrintDoc_(x){
    // Documento completo (para ventana nueva) - no depende del CSS del modal
    const p = x.pac || {};
    const t = x.tr  || {};
    const f = x.fi  || {};
    const nombre = (pick_(p, ["Nombre","NOMBRE","Paciente","PACIENTE","Nombre Paciente"]) || "Paciente");
    const ap     = pick_(p, ["Apellido","APELLIDO","Apellidos"]) || "";
    const tutor  = pick_(p, ["Tutor","TUTOR","Apoderado","APODERADO"]);
    const tel    = pick_(p, ["Telefono","Teléfono","TELEFONO","WhatsApp","WHATSAPP","Celular","CELULAR"]);
    const mail   = pick_(p, ["Email","EMAIL","Correo","CORREO"]);
    const comuna = pick_(p, ["Comuna","COMUNA"]);
    const fnac   = pick_(p, ["Fecha Nacimiento","Fecha nacimiento","FNAC","Nacimiento"]);
    const edad   = pick_(p, ["Edad","EDAD"]);
    const updated= pick_(t, ["UpdatedAt","UPDATEDAT"]) || pick_(p, ["UpdatedAt","UPDATEDAT"]) || pick_(f, ["UpdatedAt","UPDATEDAT"]);

    const rows = (title, pairs) => `
      <h2>${esc_(title)}</h2>
      <table>
        ${pairs.map(([k,v])=>`<tr><th>${esc_(k)}</th><td>${esc_(v||"—")}</td></tr>`).join("")}
      </table>
    `;

    const doc = `
      <div class="hdr">
        <div class="t1">Ficha Clínica PRO — Odontopediatría</div>
        <div class="t2">${esc_(nombre)} ${esc_(ap)} · RUN ${esc_(fmtRUN(x.run))}</div>
        <div class="t3">${tutor?`Tutor: ${esc_(tutor)} · `:""}${tel?`Tel: ${esc_(tel)} · `:""}${mail?`Email: ${esc_(mail)}`:""}</div>
        <div class="t3">${comuna?`Comuna: ${esc_(comuna)} · `:""}${fnac?`Nac: ${esc_(fnac)} · `:""}${edad?`Edad: ${esc_(edad)}`:""}${updated?` · Actualizado: ${esc_(updated)}`:""}</div>
      </div>

      ${rows("Tratamiento / Control", [
        ["Tipo de control", pick_(t, ["Tipo de Control","TipoControl","TIPO_CONTROL"])],
        ["Riesgo caries",   pick_(t, ["Riesgo Caries","RiesgoCaries","RIESGO_CARIES"])],
        ["Conducta",       pick_(t, ["Conducta","CONDUCTA"])],
        ["Próximo control",pick_(t, ["Fecha Próximo Control","Fecha Proximo Control","PROXIMO_CONTROL"])],
        ["Último control", pick_(t, ["Fecha Último Control","Fecha Ultimo Control","ULTIMO_CONTROL"])],
        ["Plan",           pick_(t, ["Plan","PLAN"])],
        ["Estado",         pick_(t, ["Estado","ESTADO"])],
        ["Probabilidad",   pick_(t, ["Probabilidad","PROBABILIDAD"])],
        ["Monto estimado (CLP)", pick_(t, ["Monto Estimado","MONTO"])],
        ["Notas",          pick_(t, ["Notas","NOTAS"])],
      ])}

      ${rows("Finanzas", [
        ["Estado pago", pick_(f, ["Estado Pago","EstadoPago","ESTADO_PAGO"])],
        ["Saldo",       pick_(f, ["Saldo","SALDO"])],
        ["Próx. vencimiento", pick_(f, ["Próximo Vencimiento","Proximo Vencimiento","VENCIMIENTO"])],
        ["Método de pago",    pick_(f, ["Método de Pago","Metodo de Pago","METODO_PAGO"])],
        ["Pagado en",         pick_(f, ["Pagado En","PagadoEn","PAGADO_EN"])],
        ["Observación",       pick_(f, ["Observación","Observacion","OBSERVACION"])],
      ])}
      <div class="foot">Generado por Orion ODP · ${new Date().toLocaleString()}</div>
    `;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Ficha PRO — ${esc_(fmtRUN(x.run))}</title>
      <link rel="stylesheet" href="./styles-2.css">
    </head><body>${doc}</body></html>`;
  }

  function printFicha_(){
    if(__lastFichaPrint) openPrintWindow_(__lastFichaPrint);
  }

  function openPrintWindow_(docHtml){
    const w = window.open("", "_blank", "noopener,noreferrer");
    if(!w){ alert("Bloqueado por el navegador (popups). Permite ventanas emergentes para imprimir."); return; }
    w.document.open();
    w.document.write(docHtml);
    w.document.close();
    w.focus();
    // un pelín de delay para que cargue estilos en algunos navegadores
    setTimeout(()=>{ try{ w.print(); }catch(e){} }, 250);
  }


  async function accionEliminar(run){
    if(!confirm(`Eliminar ${fmtRUN(run)} en PACIENTES/TRATAMIENTO/FINANZAS?\n\nEsto no se puede deshacer.`)) return;

    setStatus("Eliminando…", "");
    try{
      const token = ($("writeToken")?.value || "").trim();
      const pacSheet  = ($("sheetPac")?.value || "PACIENTES").trim();
      const tratSheet = ($("sheetTrat")?.value || "TRATAMIENTO").trim();
      const finSheet  = ($("sheetFin")?.value || "FINANZAS").trim();

      const r = await jsonpCall({
        action: "deletePaciente",
        token,
        pacSheet,
        tratSheet,
        finSheet,
        run: run
      });

      if(!r || !r.ok) throw new Error(r?.error || "No se pudo eliminar");
      setStatus("Eliminado ✅", "ok");
      await cargarTodo();
    }catch(e){
      console.error(e);
      setStatus("No se pudo eliminar ❌ (falta acción deletePaciente o permisos).", "bad");
    }
  }

  
  async function accionMarcarPagado(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;

    const nombre = `${safeStr(x.pac.Nombre)} ${safeStr(x.pac.Apellido)}`.trim();
    const metodo = prompt("Método de pago (opcional):\nEfectivo / Transferencia / Débito / Crédito / WebPay / MercadoPago", "");
    const ok = confirm(`Marcar como PAGADO a ${nombre} (${fmtRUN(run)})?\nSe dejará Saldo=0 y Estado Pago=Pagado.`);
    if(!ok) return;

    try{
      const token = getToken_();
      const finSheet = ($("sheetFin")?.value || "FINANZAS_KIDS").trim();
      const today = new Date().toISOString().slice(0,10);

      const payload = JSON.stringify({
        "Estado Pago":"Pagado",
        "Saldo": 0,
        "Pagado En": today,
        "Método de Pago": (metodo||"").trim()
      });

      const r = await jsonpCall({ action:"updateFinanzas", token, finSheet, run, payload });
      if(!r?.ok) throw new Error(r?.error || "No pude actualizar finanzas");
      setStatus("Pago actualizado ✅", "ok");
      await cargarTodo();
    }catch(e){
      console.error(e);
      setStatus("Error marcando pagado: " + (e?.message||e), "bad");
    }
  }

  async function accionReagendar(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;

    const cur = fmtDateCL(x.tr["Fecha Próximo Control"]) || "—";
    const next = prompt(`Nueva fecha de control (DD/MM/AAAA o YYYY-MM-DD)\nActual: ${cur}`, "");
    if(!next) return;

    try{
      const token = getToken_();
      const tratSheet = ($("sheetTrat")?.value || "TRATAMIENTO_KIDS").trim();

      const payload = JSON.stringify({
        "Fecha Próximo Control": next
      });

      const r = await jsonpCall({ action:"updateTratamiento", token, tratSheet, run, payload });
      if(!r?.ok) throw new Error(r?.error || "No pude actualizar tratamiento");
      setStatus("Control reagendado ✅", "ok");
      await cargarTodo();
    }catch(e){
      console.error(e);
      setStatus("Error reagendando: " + (e?.message||e), "bad");
    }
  }

  async function accionMarcarContactado(run){
    try{
      await logComunicacion_(run, "Resultados", "Recall", "CONTACTADO", "CONTACTADO", "Marcado desde Resultados");
      state.comms = state.comms || [];
      state.comms.push({ Fecha: new Date().toISOString(), RUN: run, Destino:"tutor", Canal:"Resultados", TipoMensaje:"Recall", Plantilla:"CONTACTADO", Estado:"CONTACTADO", Observación:"Marcado desde Resultados" });
      setStatus("Marcado como CONTACTADO ✅", "ok");
      renderTabla();
    }catch(e){
      console.error(e);
      setStatus("No pude marcar contacto", "warn");
    }
  }
// ------------------------------
  // Guardar paciente (Apps Script: upsertPaciente por JSONP GET)
  // ------------------------------
