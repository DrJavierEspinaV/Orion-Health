
  // Helpers de estado
  const okStatus  = msg => { try{ const el=document.getElementById("jsStatus"); if(el){ el.textContent=msg; el.className="mb-4 p-3 md:p-4 rounded-xl bg-white/70 border text-sm text-slate-700"; } }catch(e){} };
  const errStatus = msg => { try{ const el=document.getElementById("jsStatus"); if(el){ el.textContent=msg; el.className="mb-4 p-3 md:p-4 rounded-xl bg-rose-50 border border-rose-300 text-sm text-rose-700"; } }catch(e){} };

  // Si XLSX no cargó, lo decimos de inmediato (suele pasar con bloqueo de CDN)
  if (typeof XLSX === "undefined"){
    errStatus("No cargó la librería XLSX (bloqueo de CDN / sin internet). Prueba con internet o desactiva bloqueadores.");
    throw new Error("XLSX no disponible");
  }

    /* ========= Listado base ========= */
    let CODES = [
      { codigo: "50007072", nombre_insumo: "MEMBRANA 15X20 (COLÁGENO)", unidad: "", tipo: "", proveedor: "" },
      { codigo: "50022089", nombre_insumo: "HUESO MINEROSS JERINGA ESPON 1.0 XENOINJ", unidad: "", tipo: "", proveedor: "" }
    ];

    // --- DOM refs ---
    const selector = document.getElementById('selector');
    const search = document.getElementById('search');
    const cantidad = document.getElementById('cantidad');
    const chips = document.getElementById('chips');
    const tabla = document.getElementById('tabla');
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    const importInfo = document.getElementById('importInfo');

    const nombre = document.getElementById('nombre');
    const run = document.getElementById('run');
    const episodio = document.getElementById('episodio');
    const dia = document.getElementById('dia');
    const horaQx = document.getElementById('horaQx');
    const tiempo = document.getElementById('tiempo');
    const obs = document.getElementById('obs');
    const cirugia = document.getElementById('cirugia');

    const pacienteNombre = document.getElementById('pacienteNombre');
    const pacienteRun = document.getElementById('pacienteRun');

    const correo = document.getElementById('correo');
    const cc = document.getElementById('cc');
    const asunto = document.getElementById('asunto');
    const mensaje = document.getElementById('mensaje');
    const mailtoLink = document.getElementById('mailtoLink');
    const copiarBtn = document.getElementById('copiarBtn');
    const generarExcelInline = document.getElementById('btnGenerarExcelInline');
    const statusExcel = document.getElementById('statusExcel');

    // Aliases de compatibilidad (por si quedó código viejo)
    window.generarExcelInline = generarExcelInline;
    window.generarExcellnline = generarExcelInline; // typo antiguo
    window.generarExcelInlineFn = () => generarExcelInline?.click();

    const CCMM_FIJO = "INTEGRAMEDICA TOBALABA";
    let seleccionados = [];

    function renderOptions(filtro=""){
      selector.innerHTML = "";
      const f = (filtro||"").toLowerCase();
      const lista = CODES.filter(it =>
        (it.nombre_insumo||"").toLowerCase().includes(f) ||
        (it.codigo||"").toLowerCase().includes(f) ||
        (it.tipo||"").toLowerCase().includes(f) ||
        (it.proveedor||"").toLowerCase().includes(f)
      );
      for(const it of lista){
        const opt = document.createElement('option');
        opt.value = it.codigo;
        const unidad = it.unidad ? ` — ${it.unidad}` : "";
        const tipoTxt = it.tipo ? ` — ${it.tipo}` : "";
        const provTxt = it.proveedor ? ` — ${it.proveedor}` : "";
        opt.textContent = `${it.nombre_insumo} [${it.codigo}]${unidad}${tipoTxt}${provTxt}`;
        selector.appendChild(opt);
      }
      if (!selector.value && selector.options.length) selector.selectedIndex = 0;
    }

    function renderTabla(){
      tabla.innerHTML = "";
      chips.innerHTML = "";
      seleccionados.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="border p-2">${it.codigo}</td>
          <td class="border p-2">${it.nombre}</td>
          <td class="border p-2">${it.unidad || ""}</td>
          <td class="border p-2 text-center">${it.cantidad}</td>
          <td class="border p-2 text-center">
            <button class="px-2 py-1 text-white bg-rose-600 rounded" data-idx="${idx}" type="button">Quitar</button>
          </td>
        `;
        tabla.appendChild(tr);

        const chip = document.createElement('span');
        chip.className = "inline-flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-xs";
        chip.innerHTML = `<span>${it.nombre} <span class="opacity-60">[${it.codigo}]</span> × <strong>${it.cantidad}</strong></span>`;
        const b = document.createElement('button');
        b.className = "text-rose-700 hover:text-rose-900";
        b.textContent = "×";
        b.type = "button";
        b.onclick = () => removeIdx(idx);
        chip.appendChild(b);
        chips.appendChild(chip);
      });

      tabla.querySelectorAll('button[data-idx]').forEach(btn => {
        btn.addEventListener('click', (e) => removeIdx(parseInt(e.target.getAttribute('data-idx'))));
      });
    }

    function removeIdx(i){
      seleccionados.splice(i,1);
      renderTabla();
    }

    function addSelected(){
      const codigo = selector.value;
      if (!codigo) return;
      const item = CODES.find(x => x.codigo === codigo);
      if (!item) return;
      const qty = Math.max(1, parseInt(cantidad.value || "1"));
      const found = seleccionados.find(x => x.codigo === codigo);
      if (found){
        found.cantidad += qty;
      }else{
        seleccionados.push({
          codigo: item.codigo,
          nombre: item.nombre_insumo,
          unidad: item.unidad || "",
          tipo: item.tipo || "",
          proveedor: item.proveedor || "",
          cantidad: qty
        });
      }
      renderTabla();
    }

    function buildMessage(){
      const prof = nombre.value || "";
      const rut  = run.value || "";
      const epi  = episodio.value || "";
      const pNom = pacienteNombre.value || "";
      const pRun = pacienteRun.value || "";
      const fecha = dia.value || "";
      const hora  = horaQx.value || "";
      const mins  = tiempo.value || "";
      const ob = obs.value || "";
      const cir = cirugia.value || "";

      let lines = [];
      lines.push("Estimado Jefe Dental Tobalaba:");
      lines.push("");
      lines.push("Solicito los siguientes insumos para la intervención programada:");
      lines.push("");
      if (prof) lines.push(`👨‍⚕️ Profesional: ${prof}`);
      if (rut)  lines.push(`🪪 RUN Profesional: ${rut}`);
      if (pNom || pRun) lines.push(`🧍 Paciente: ${pNom}${pRun ? " — RUN: " + pRun : ""}`);
      if (epi)  lines.push(`🧾 Episodio: ${epi}`);
      if (fecha) lines.push(`📅 Día pabellón: ${fecha}${hora ? " — Hora: " + hora : ""}`);
      if (mins) lines.push(`⏱️ Tiempo quirúrgico estimado: ${mins} minutos`);
      if (cir)  lines.push(`🔧 Cirugía: ${cir}`);
      lines.push("");
      lines.push("🧰 Insumos solicitados:");
      if (seleccionados.length === 0) {
        lines.push("- (sin insumos seleccionados)");
      } else {
        for (const it of seleccionados) {
          const uni = it.unidad ? ` — ${it.unidad}` : "";
          const tipo = it.tipo ? ` — ${it.tipo}` : "";
          const prov = it.proveedor ? ` — ${it.proveedor}` : "";
          lines.push(`- ${it.nombre} [${it.codigo}] — Cantidad: ${it.cantidad}${uni}${tipo}${prov}`);
        }
      }
      if (ob) {
        lines.push("");
        lines.push(`Observaciones: ${ob}`);
      }
      lines.push("");
      if (prof) lines.push(`Atentamente,\n${prof}`);
      return lines.join("\n");
    }

    function generateMailto(){
      const to = (correo.value || "Rodrigo.DiazG@integramedica.cl").trim();
      const ccAddr = (cc.value || "jennifer.bravo@integramedica.cl").trim();
      const subj = (asunto.value || "Solicitud de Insumos — Dr. Javier Espina — ").trim();
      const body = buildMessage();
      mensaje.value = body;
      let mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      if (ccAddr) mailto += `&cc=${encodeURIComponent(ccAddr)}`;
      mailtoLink.href = mailto;
    }


