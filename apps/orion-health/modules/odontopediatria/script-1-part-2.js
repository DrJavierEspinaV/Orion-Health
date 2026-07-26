function renderTabla(){
    const tb = $("tbody");
    tb.innerHTML = "";

    for(const x of state.filtered){
      const nombre = `${safeStr(x.pac.Nombre)} ${safeStr(x.pac.Apellido)}`.trim() || "(sin nombre)";

      // Control: fecha + tipo
      const tipoCtrl = safeStr(x.tr["Tipo de Control"]);
      const controlDate = fmtDateCL(x.tr["Fecha Próximo Control"]);
      const ctrlTxt = (controlDate || tipoCtrl) ? `${controlDate || "—"}${tipoCtrl ? ` · ${escapeHtml_(tipoCtrl)}` : ""}` : "—";

      // Riesgo / Conducta: tags
      const riesgo = safeStr(x.tr["Riesgo Caries"]);
      const conducta = safeStr(x.tr["Conducta"]);
      const rcHtml = [
        riesgo ? tagLite(`Riesgo: ${riesgo}`) : "",
        conducta ? tagLite(`Conducta: ${conducta}`) : ""
      ].filter(Boolean).join(" ");
      const rcCell = rcHtml || "—";

      // Pago: semáforo + saldo + vencimiento
      const saldoRaw = x.fi["Saldo"];
      const saldoNum = moneyNum_(saldoRaw);
      const vencRaw = x.fi["Próximo Vencimiento"];
      const st = dueStatus(saldoRaw, vencRaw);
      const vencTxt = fmtDateCL(vencRaw);
      const pagoHtml = `${pillLite(st.cls, st.label)} <span class="mono">${clp(saldoNum)}</span>${vencTxt ? ` · ${escapeHtml_(vencTxt)}` : ""}`;
      const contacted = (["CONTACTADO","ENVIADO"].includes(getCommStatusByRun_(x.run)));

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="name">${escapeHtml_(nombre)} ${contacted ? `<span class="pillLite pillOk" style="margin-left:6px">${getCommStatusByRun_(x.run)}</span>` : ""}</div>
          <div class="subline">${escapeHtml_(fmtRUN(x.run))}</div>
        </td>
        <td>${ctrlTxt}</td>
        <td>${rcCell}</td>
        <td>${pagoHtml}</td>
        <td>
          <div class="actions">
            <button class="wa" data-run="${escapeAttr_(x.run)}" type="button">WhatsApp</button>
            <button class="em" data-run="${escapeAttr_(x.run)}" type="button">Email</button>
            <button class="cp" data-run="${escapeAttr_(x.run)}" type="button">Copiar</button>
            <button class="vw" data-run="${escapeAttr_(x.run)}" type="button">Ver ficha</button>
            <button class="dl" data-run="${escapeAttr_(x.run)}" type="button">Eliminar</button>
          </div>
          <div class="actions" style="margin-top:8px;gap:8px;flex-wrap:wrap">
            <button class="btnGhost" data-act="paid" data-run="${escapeAttr_(x.run)}" type="button">Marcar pagado</button>
            <button class="btnGhost" data-act="move" data-run="${escapeAttr_(x.run)}" type="button">Reagendar</button>
            <button class="btnGhost ${contacted ? "btnDone" : ""}" data-act="contact" data-run="${escapeAttr_(x.run)}" type="button" ${contacted ? "disabled" : ""}>${contacted ? "Contactado ✓" : "Contactado"}</button>
          </div>
        </td>
      `;
      tb.appendChild(tr);
    }

    tb.querySelectorAll("button.wa").forEach(b=>b.onclick=()=>accionWhatsApp(b.dataset.run));
    tb.querySelectorAll("button.em").forEach(b=>b.onclick=()=>accionEmail(b.dataset.run));
    tb.querySelectorAll("button.cp").forEach(b=>b.onclick=()=>accionCopiar(b.dataset.run));
    tb.querySelectorAll("button.vw").forEach(b=>b.onclick=()=>accionVerFicha(b.dataset.run));
    tb.querySelectorAll("button.dl").forEach(b=>b.onclick=()=>accionEliminar(b.dataset.run));

    tb.querySelectorAll("button.btnGhost").forEach(b=>{
      const run = b.dataset.run;
      const act = b.dataset.act;
      if(act==="paid") b.onclick = ()=>accionMarcarPagado(run);
      if(act==="move") b.onclick = ()=>accionReagendar(run);
      if(act==="contact") b.onclick = ()=>accionMarcarContactado(run);
    });
  }

  // ------------------------------
  // Plantillas
  // ------------------------------
  function getPlantilla(tipo){
    const firma = ($("firma")?.value || "").trim() || "Clínica – Odontopediatría";
    const links = ($("links")?.value || "").trim();
    const linksTxt = links ? `

Links / documentos:
${links}` : "";

    // Odontopediatría: normalmente se escribe al apoderado por el niño/a.
    // Evitamos depender de {{Tutor}} (si falta no rompe el mensaje).
    switch(tipo){
      case "Recordatorio control":
        return `Hola,
les escribimos por {{Nombre}} {{Apellido}} (RUN {{RUN}}).
Recordatorio de control: {{FechaControl}} ({{TipoControl}}).
¿Nos confirman asistencia?${linksTxt}

${firma}`.trim();

      case "Prevención (higiene + dieta)":
        return `Hola,
mensaje preventivo para {{Nombre}} {{Apellido}}:
• Cepillado 2–3 veces al día con pasta fluorada (según edad)
• Reducir azúcares entre comidas
• Agua como bebida principal
Si necesitan orientación, respondan por este WhatsApp.${linksTxt}

${firma}`.trim();

      case "Fluoración / sellantes (post)":
        return `Hola,
indicaciones para {{Nombre}} {{Apellido}}:
• Evitar comer 30 min después del procedimiento
• Hoy: evitar alimentos pegajosos si hubo sellantes
• Mantener higiene habitual
Si aparece dolor intenso o inflamación, avísennos.${linksTxt}

${firma}`.trim();

      case "Trauma dental (control)":
        return `Hola,
control por trauma dental de {{Nombre}} {{Apellido}}.
Recordatorio de control: {{FechaControl}}.
Si hay dolor, cambio de color del diente, movilidad o fístula, avísennos antes del control.${linksTxt}

${firma}`.trim();

      case "Pago (recordatorio)":
        return `Hola,
les escribimos por {{Nombre}} {{Apellido}}.
Estado de pago: {{EstadoPago}}.
Próximo vencimiento: {{Vencimiento}}.
Si ya pagaron, envíen el comprobante y lo actualizamos.${linksTxt}

${firma}`.trim();

      case "Envío de presupuesto":
        return `Hola,
les enviamos el presupuesto/plan asociado a {{Nombre}} {{Apellido}}.
Si quieren, coordinamos una llamada breve para resolver dudas.${linksTxt}

${firma}`.trim();

      case "Promoción":
        return `Hola,
compartimos un beneficio/promoción vigente.
Si desean detalles, respondan a este mensaje.${linksTxt}

${firma}`.trim();

      case "Mensaje libre (con firma)":
      default:
        return `Hola,${linksTxt}

${firma}`.trim();
    }
  }

  function buildMsg(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return "";
    const tipo = $("tipoMsg").value;
    let msg = getPlantilla(tipo);
    msg = msg.replaceAll("{{Nombre}}", safeStr(x.pac.Nombre));
    msg = msg.replaceAll("{{Apellido}}", safeStr(x.pac.Apellido));
    msg = msg.replaceAll("{{Tutor}}", safeStr(x.pac.Tutor) || safeStr(x.pac.Apoderado) || safeStr(x.pac.TutorNombre) || "");
    msg = msg.replaceAll("{{RUN}}", fmtRUN(x.run));
    msg = msg.replaceAll("{{FechaControl}}", fmtDateCL(x.tr["Fecha Próximo Control"]));
    msg = msg.replaceAll("{{TipoControl}}", safeStr(x.tr["Tipo de Control"]));
    msg = msg.replaceAll("{{EstadoPago}}", pagoLabel(x.fi["Estado Pago"], x.fi["Saldo"]) || "—");
    msg = msg.replaceAll("{{Vencimiento}}", fmtDateCL(x.fi["Próximo Vencimiento"]) || safeStr(x.fi["Próximo Vencimiento"]));
    return msg.trim();
  }

  // ------------------------------
  // Acciones
  // ------------------------------

  async function copyToClipboardSafe(text){
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(_){}
    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    }catch(_){
      return false;
    }
  }

  function accionCopiar(run){
    const msg = buildMsg(run);
    copyToClipboardSafe(msg).then(ok=>{
      setStatus(ok ? "Texto copiado ✅" : "No se pudo copiar (bloqueo del navegador).", ok ? "ok" : "warn");
    });
  }

  function normalizePhoneCL(raw){
    const digits = String(raw||"").replace(/\D/g,"");
    if(!digits) return "";
    if(digits.startsWith("56")) return digits;
    if(digits.length === 9 && digits.startsWith("9")) return "56" + digits;
    return digits;
  }
