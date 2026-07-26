    asunto.addEventListener('input', generateMailto);
    mensaje.addEventListener('input', generateMailto);
    search.addEventListener('input', (e) => renderOptions(e.target.value));

    generateMailto();
    loadCatalogoBase();

    /* ====== Generar Excel CCMM (descarga local) ====== */
    function generarExcelCCMM(){
      const pNom = (pacienteNombre.value || "").trim();
      const pRun = (pacienteRun.value || "").trim();
      const fecha = (dia.value || "").trim();
      if(!pNom || !pRun || !fecha){ statusExcel.textContent = "Completa: Nombre paciente, RUN y Día Qx."; return null; }
      if(seleccionados.length === 0){ statusExcel.textContent = "Agrega al menos un insumo."; return null; }

      const rowsOut = seleccionados.map(it => ({
        "CCMM": CCMM_FIJO,
        "RUT PACIENTE": pRun,
        "NOMBRE PACIENTE": pNom,
        "EPISODIO": (episodio.value || ""),
        "PROFESIONAL": (nombre.value || ""),
        "CIRUGÍA": (cirugia.value || ""),
        "FECHA Qx": fecha,
        "HORA Qx": (horaQx.value || ""),
        "CÓDIGO": it.codigo,
        "TIPO": it.tipo || "",
        "INSUMOS": it.nombre,
        "CANTIDAD": it.cantidad,
        "PROVEEDOR": it.proveedor || ""
      }));

      const ws = XLSX.utils.json_to_sheet(rowsOut, { skipHeader: false });
      ws["!cols"] = [
        { wch: 24 }, { wch: 14 }, { wch: 26 }, { wch: 12 }, { wch: 22 },
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
        { wch: 30 }, { wch: 10 }, { wch: 16 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Solicitud");

      const fname = `Solicitud CCMM – ${pNom} - ${pRun}.xlsx`;
      try{
        if (XLSX && XLSX.writeFile) { XLSX.writeFile(wb, fname); }
        else if (XLSX && XLSX.writeFileXLSX) { XLSX.writeFileXLSX(wb, fname); }
        else {
          const blob = new Blob([XLSX.write(wb, {bookType:'xlsx', type:'array'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
          setTimeout(()=>URL.revokeObjectURL(url), 2000);
        }
      }catch(e){ console.error(e); }
      return true;
    }

    // Listener único
    generarExcelInline?.addEventListener('click', () => {
      if (statusExcel) statusExcel.textContent = "Generando Excel…";
      try { generateMailto(); } catch(_){}
      let ok = false;
      try { ok = !!generarExcelCCMM(); } catch(e){ console.error(e); ok=false; }
      if (ok){
        if (statusExcel) statusExcel.textContent = "Excel descargado. Adjunta el archivo al correo.";
        okStatus("Listo: cuerpo del correo actualizado + Excel descargado.");
      } else {
        if (statusExcel) statusExcel.textContent = "Completa datos obligatorios o agrega al menos un insumo. El cuerpo del correo se actualizó igual.";
        try { generateMailto(); } catch(_){}
        errStatus("Faltan datos mínimos para Excel, pero el mensaje fue preparado.");
      }
    });


  window.addEventListener('error', (e) => {
    const msg = "JS error: " + (e.message || e.error || e.filename || "desconocido");
    console.error(msg);
    const st = document.getElementById('jsStatus');
    if (st){ st.textContent = msg; st.className = "mb-4 p-3 md:p-4 rounded-xl bg-rose-50 border border-rose-300 text-sm text-rose-700"; }
  });
