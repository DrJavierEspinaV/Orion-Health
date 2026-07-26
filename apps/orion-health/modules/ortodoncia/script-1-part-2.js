  function renderTabla(){
    const tb = $("tbody");
    tb.innerHTML = "";

    for(const x of state.filtered){
      const nombre = `${safeStr(x.pac.Nombre)} ${safeStr(x.pac.Apellido)}`.trim() || "(sin nombre)";

      const tratamiento = [
        safeStr(x.tr["Tipo de Tratamiento"]),
        safeStr(x.tr["Clase"]) ? `· Clase ${safeStr(x.tr["Clase"])}` : "",
        safeStr(x.tr["Fase"]) ? `· ${safeStr(x.tr["Fase"])}` : ""
      ].filter(Boolean).join(" ");

      const control = safeStr(x.tr["Fecha Próximo Control"]);
      const pago = safeStr(x.fi["Estado Pago"]) || "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="name">${escapeHtml(nombre)}</div>
          <div class="subline">${escapeHtml(fmtRUN(x.run))}</div>
        </td>
        <td>${escapeHtml(tratamiento || "—")}</td>
        <td>${escapeHtml(control || "—")}</td>
        <td>${escapeHtml(pago || "—")}</td>
        <td class="actions">
          <button class="wa" data-run="${escapeAttr(x.run)}" type="button">WhatsApp</button>
          <button class="em" data-run="${escapeAttr(x.run)}" type="button">Email</button>
          <button class="cp" data-run="${escapeAttr(x.run)}" type="button">Copiar</button>
          <button class="vw" data-run="${escapeAttr(x.run)}" type="button">Ver ficha</button>
          <button class="dl" data-run="${escapeAttr(x.run)}" type="button">Eliminar</button>
        </td>
      `;
      tb.appendChild(tr);
    }

    tb.querySelectorAll("button.wa").forEach(b=>b.onclick=()=>accionWhatsApp(b.dataset.run));
    tb.querySelectorAll("button.em").forEach(b=>b.onclick=()=>accionEmail(b.dataset.run));
    tb.querySelectorAll("button.cp").forEach(b=>b.onclick=()=>accionCopiar(b.dataset.run));
    tb.querySelectorAll("button.vw").forEach(b=>b.onclick=()=>accionVerFicha(b.dataset.run));
    tb.querySelectorAll("button.dl").forEach(b=>b.onclick=()=>accionEliminar(b.dataset.run));
  }

  // ------------------------------
  // Plantillas
  // ------------------------------
  function getPlantilla(tipo){
    const firma = ($("firma")?.value || "").trim() || "Clínica Dr. Nicolás González — Ortodoncia";
    const links = ($("links")?.value || "").trim();
    const linksTxt = links ? `\n\nLinks:\n${links}` : "";

    if(tipo==="Recordatorio control"){
      return `Hola {{Nombre}} {{Apellido}},\nte recordamos tu control de ortodoncia el {{FechaControl}}.\nPor favor confirma tu asistencia respondiendo a este mensaje.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Cambio de alineadores"){
      return `Hola {{Nombre}},\nrecordatorio: corresponde cambio de alineadores según tu plan.\nSi tienes dudas o molestias, respóndenos por este WhatsApp.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Uso de elásticos"){
      return `Hola {{Nombre}},\nrecordatorio rápido: uso de elásticos según indicación (horas/día).\nLa constancia = avance. Si algo duele raro, avísanos.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Higiene (recordatorio)"){
      return `Hola {{Nombre}},\nrecordatorio de higiene: cepillado después de cada comida + uso de seda/interdental.\nEsto evita manchas y caries durante el tratamiento.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Pago (recordatorio)"){
      return `Hola {{Nombre}},\nte recordamos que tu estado de pago figura como: {{EstadoPago}}.\nPróximo vencimiento: {{Vencimiento}}.\nSi ya pagaste, ignora este mensaje y envíanos el comprobante.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Envío de presupuesto"){
      return `Hola {{Nombre}},\nte enviamos tu presupuesto/plan asociado al tratamiento.\nSi deseas, coordinamos una llamada breve para resolver dudas.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Indicaciones instalación"){
      return `Hola {{Nombre}},\nindicaciones post-instalación:\n• Sensibilidad 48–72h puede ser normal\n• Evita alimentos duros/pegajosos\n• Higiene estricta\nSi se despega algo o duele mucho, avísanos.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Indicaciones retiro"){
      return `Hola {{Nombre}},\nindicaciones post-retiro:\n• Mantén higiene rigurosa\n• Usa retenedores según indicación\n• Si notas movilidad o molestias, avísanos.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Uso de retenedores"){
      return `Hola {{Nombre}},\nrecordatorio: el uso de retenedores es clave para mantener el resultado.\nSi se rompe o ajusta raro, avísanos para control.${linksTxt}\n\n${firma}`;
    }
    if(tipo==="Promoción"){
      return `Hola {{Nombre}},\nte compartimos una promoción vigente / beneficio disponible.\nSi quieres más detalles, responde a este mensaje.${linksTxt}\n\n${firma}`;
    }
    // Mensaje libre
    return `Hola {{Nombre}},\n${linksTxt ? ("\n"+linksTxt.trim()) : ""}\n\n${firma}`.trim();
  }

  function buildMsg(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return "";
    const tipo = $("tipoMsg").value;
    let msg = getPlantilla(tipo);
    msg = msg.replaceAll("{{Nombre}}", safeStr(x.pac.Nombre));
    msg = msg.replaceAll("{{Apellido}}", safeStr(x.pac.Apellido));
    msg = msg.replaceAll("{{RUN}}", fmtRUN(x.run));
    msg = msg.replaceAll("{{FechaControl}}", safeStr(x.tr["Fecha Próximo Control"]));
    msg = msg.replaceAll("{{EstadoPago}}", safeStr(x.fi["Estado Pago"]) || "—");
    msg = msg.replaceAll("{{Vencimiento}}", safeStr(x.fi["Próximo Vencimiento"]));
    return msg.trim();
  }

  // ------------------------------
  // Acciones
  // ------------------------------
  function accionCopiar(run){
    const msg = buildMsg(run);
    navigator.clipboard?.writeText(msg);
    setStatus("Texto copiado ✅", "ok");
  }

  function normalizePhoneCL(raw){
    const digits = String(raw||"").replace(/\D/g,"");
    if(!digits) return "";
    if(digits.startsWith("56")) return digits;
    if(digits.length === 9 && digits.startsWith("9")) return "56" + digits;
    return digits;
  }

  function accionWhatsApp(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;
    const phone = normalizePhoneCL(x.pac.WhatsApp || x.pac.Whatsapp);
    const msg = encodeURIComponent(buildMsg(run));
    if(!phone) return setStatus("Paciente sin WhatsApp.", "bad");
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, "_blank");
  }

  function accionEmail(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;
    const to = safeStr(x.pac.Email);
    if(!to) return setStatus("Paciente sin Email.", "bad");
    const subject = encodeURIComponent("Ortodoncia — Mensaje");
    const body = encodeURIComponent(buildMsg(run));
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
  }

  function accionVerFicha(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;
    const payload = {
      RUN: fmtRUN(x.run),
      PACIENTES: x.pac,
      TRATAMIENTO: x.tr,
      FINANZAS: x.fi
    };
    $("fichaPre").textContent = JSON.stringify(payload, null, 2);
    $("dlgFicha").showModal();
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

  // ------------------------------
  // Guardar paciente (Apps Script: upsertPaciente por JSONP GET)
  // ------------------------------
