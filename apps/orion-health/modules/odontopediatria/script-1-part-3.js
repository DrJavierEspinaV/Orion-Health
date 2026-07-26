  function accionWhatsApp(run, opts={}){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;

    // Promoción => requiere consentimiento
    const tipo = $("tipoMsg")?.value || "";
    if(tipo==="Promoción"){
      const ok = safeStr(x.pac["Consentimiento Promociones"] || x.pac.ConsPromo || x.pac.ConsentimientoPromo).toLowerCase();
      if(ok !== "sí" && ok !== "si") return setStatus("Sin consentimiento para promociones ❌", "bad");
    }

    const destino = ($("destinoMsg")?.value || "tutor").trim();
    const phoneTutor = normalizePhoneCL(x.pac["Tutor WhatsApp"] || x.pac.TutorWhatsApp || x.pac.TutorWA || x.pac.WhatsappTutor || x.pac.WhatsAppTutor);
    const phonePac = normalizePhoneCL(x.pac.WhatsApp || x.pac.Whatsapp);

    const phone = (destino==="tutor" ? (phoneTutor || phonePac) : (phonePac || phoneTutor));
    const msg = encodeURIComponent(buildMsg(run));

    if(!phone) return setStatus("Sin WhatsApp (paciente/apoderado).", "bad");
    logComunicacion_(run, "WhatsApp", ($("tipoMsg")?.value||""), ($("tipoMsg")?.value||""), "ENVIADO", "Click WhatsApp");

      state.comms = state.comms || [];
      state.comms.push({ Fecha: new Date().toISOString(), RUN: run, Destino:"tutor", Canal:"WhatsApp", TipoMensaje: ($("tipoMsg")?.value||""), Plantilla: ($("tipoMsg")?.value||""), Estado:"ENVIADO", Observación:"Click WhatsApp" });
      renderTabla();
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, "_blank");
  }

  function accionEmail(run, opts={}){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;

    // Promoción => requiere consentimiento
    const tipo = $("tipoMsg")?.value || "";
    if(tipo==="Promoción"){
      const ok = safeStr(x.pac["Consentimiento Promociones"] || x.pac.ConsPromo || x.pac.ConsentimientoPromo).toLowerCase();
      if(ok !== "sí" && ok !== "si") return setStatus("Sin consentimiento para promociones ❌", "bad");
    }

    const destino = ($("destinoMsg")?.value || "tutor").trim();
    const emailTutor = safeStr(x.pac["Tutor Email"] || x.pac.TutorEmail || x.pac.EmailTutor);
    const emailPac = safeStr(x.pac.Email);

    const to = (destino==="tutor" ? (emailTutor || emailPac) : (emailPac || emailTutor));
    if(!to) return setStatus("Sin Email (paciente/apoderado).", "bad");

    const subject = encodeURIComponent("Odontopediatría — Mensaje");
    const body = encodeURIComponent(buildMsg(run));
    logComunicacion_(run, "Email", ($("tipoMsg")?.value||""), ($("tipoMsg")?.value||""), "ENVIADO", "Click Email");

      state.comms = state.comms || [];
      state.comms.push({ Fecha: new Date().toISOString(), RUN: run, Destino:"tutor", Canal:"Email", TipoMensaje: ($("tipoMsg")?.value||""), Plantilla: ($("tipoMsg")?.value||""), Estado:"ENVIADO", Observación:"Click Email" });
      renderTabla();
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
  }

  function accionVerFicha(run){
    const x = state.filtered.find(z=>z.run===run) || state.merged.find(z=>z.run===run);
    if(!x) return;
    const html = renderFichaProHTML_(x);
    $("fichaPro").innerHTML = html;
    __lastFichaPrint = renderFichaPrintDoc_(x); // documento completo para imprimir
    $("dlgFicha").showModal();
  }

  // ===== Ficha Clínica PRO (modal + impresión) =====
  let __lastFichaPrint = "";

  function safeStr_(v){
    if(v===null || v===undefined) return "";
    if(v instanceof Date) return v.toISOString().slice(0,10);
    return String(v).trim();
  }
  function pick_(obj, keys){
    if(!obj) return "";
    for(const k of keys){
      if(obj[k]!==undefined && obj[k]!==null && String(obj[k]).trim()!=="") return safeStr_(obj[k]);
    }
    return "";
  }
  function esc_(s){
    return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }
  function kvLine_(k,v, cls=""){
    const vv = esc_(v||"—");
    return `<div class="k">${esc_(k)}</div><div class="v ${cls}">${vv}</div>`;
  }

  function renderFichaProHTML_(x){
    const p = x.pac || {};
    const t = x.tr  || {};
    const f = x.fi  || {};

    const nombre = pick_(p, ["Nombre","NOMBRE","Paciente","PACIENTE","Nombre Paciente","Nombre niño","Nombre Niño"]) || "Paciente";
    const ap     = pick_(p, ["Apellido","APELLIDO","Apellidos"]) || "";
    const tutor  = pick_(p, ["Tutor","TUTOR","Nombre tutor","Nombre Tutor","Apoderado","APODERADO"]);
    const tel    = pick_(p, ["Telefono","Teléfono","TELEFONO","WhatsApp","WHATSAPP","Celular","CELULAR"]);
    const mail   = pick_(p, ["Email","EMAIL","Correo","CORREO","Correo electrónico"]);
    const comuna = pick_(p, ["Comuna","COMUNA"]);
    const fnac   = pick_(p, ["Fecha Nacimiento","Fecha nacimiento","FNAC","Nacimiento","F.Nac"]);
    const edad   = pick_(p, ["Edad","EDAD"]);
    const updated= pick_(t, ["UpdatedAt","UPDATEDAT"]) || pick_(p, ["UpdatedAt","UPDATEDAT"]) || pick_(f, ["UpdatedAt","UPDATEDAT"]);

    const tipoCtrl = pick_(t, ["Tipo de Control","TipoControl","TIPO_CONTROL"]);
    const riesgo   = pick_(t, ["Riesgo Caries","RiesgoCaries","RIESGO_CARIES"]);
    const conducta = pick_(t, ["Conducta","CONDUCTA"]);
    const proxCtrl = pick_(t, ["Fecha Próximo Control","Fecha Proximo Control","Proximo Control","PROXIMO_CONTROL"]);
    const ultCtrl  = pick_(t, ["Fecha Último Control","Fecha Ultimo Control","Ultimo Control","ULTIMO_CONTROL"]);
    const plan     = pick_(t, ["Plan","PLAN"]);
    const estadoTr = pick_(t, ["Estado","ESTADO"]);
    const prob     = pick_(t, ["Probabilidad","PROBABILIDAD"]);
    const monto    = pick_(t, ["Monto Estimado","Monto","MONTO"]);
    const notas    = pick_(t, ["Notas","NOTAS"]);

    const estadoPago = pick_(f, ["Estado Pago","EstadoPago","ESTADO_PAGO"]);
    const saldo      = pick_(f, ["Saldo","SALDO"]);
    const venc       = pick_(f, ["Próximo Vencimiento","Proximo Vencimiento","Vencimiento","VENCIMIENTO"]);
    const metodo     = pick_(f, ["Método de Pago","Metodo de Pago","MetodoPago","METODO_PAGO"]);
    const pagadoEn   = pick_(f, ["Pagado En","PagadoEn","PAGADO_EN"]);
    const obsFin     = pick_(f, ["Observación","Observacion","OBSERVACION"]);

    return `
      <div class="fichaTop">
        <div>
          <div class="who">${esc_(nombre)} ${esc_(ap)}</div>
          <div class="meta">
            <b>RUN:</b> ${esc_(fmtRUN(x.run))}${tutor?` · <b>Tutor:</b> ${esc_(tutor)}`:""}
            ${tel?` · <b>Tel:</b> ${esc_(tel)}`:""}${mail?` · <b>Email:</b> ${esc_(mail)}`:""}
          </div>
          <div class="meta">
            ${comuna?`<b>Comuna:</b> ${esc_(comuna)} · `:""}${fnac?`<b>Nac:</b> ${esc_(fnac)} · `:""}${edad?`<b>Edad:</b> ${esc_(edad)}`:""}
          </div>
        </div>
        <div class="meta">${updated?`Actualizado: ${esc_(updated)}`:""}</div>
      </div>

      <div class="fichaGrid">
        <div class="sec">
          <h3>Tratamiento / Control</h3>
          <div class="kv">
            ${kvLine_("Tipo de control", tipoCtrl)}
            ${kvLine_("Riesgo caries", riesgo)}
            ${kvLine_("Conducta", conducta)}
            ${kvLine_("Próximo control", proxCtrl)}
            ${kvLine_("Último control", ultCtrl)}
            ${kvLine_("Plan", plan)}
            ${kvLine_("Estado", estadoTr)}
            ${kvLine_("Probabilidad", prob)}
            ${kvLine_("Monto estimado (CLP)", monto, "mono")}
          </div>
          ${notas?`<div style="margin-top:10px"><div class="small" style="font-weight:900;margin:0 0 6px">Notas</div><div class="fichaNotes">${esc_(notas)}</div></div>`:""}
        </div>

        <div class="sec">
          <h3>Finanzas</h3>
          <div class="kv">
            ${kvLine_("Estado pago", estadoPago)}
            ${kvLine_("Saldo", saldo, "mono")}
            ${kvLine_("Próx. vencimiento", venc)}
            ${kvLine_("Método de pago", metodo)}
            ${kvLine_("Pagado en", pagadoEn)}
            ${kvLine_("Observación", obsFin)}
          </div>
        </div>
      </div>

      <div class="fichaActions">
        <button class="xbtn btnPrint" type="button" onclick="printFicha_()">Imprimir ficha</button>
      </div>
    `;
  }
