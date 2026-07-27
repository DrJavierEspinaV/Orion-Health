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
    $("mensLayout").style.display = isMens ? "" : "none";
    $("ingresoCard").style.display = isMens ? "none" : "";
    $("tabMensajeria").classList.toggle("active", isMens);
    $("tabIngreso").classList.toggle("active", !isMens);
  }

  function init(){
    $("tabMensajeria").onclick = ()=>showTab("mens");
    $("tabIngreso").onclick = ()=>showTab("ing");

    $("btnPing").onclick = ping;
    $("btnLoad").onclick = cargarTodo;
    $("btnApply").onclick = aplicarFiltros;
    $("btnClear").onclick = ()=>{
      $("fTipo").value = "";
      $("fFase").value = "";
      $("fElast").value = "";
      $("fPago").value = "";
      $("fControl").value = "";
      $("fSearch").value = "";
      aplicarFiltros();
    };

    $("btnPreview").onclick = ()=>{ $("preview").value = getPlantilla($("tipoMsg").value); };
    $("btnCopy").onclick = ()=>{ navigator.clipboard?.writeText($("preview").value||""); setStatus("Vista previa copiada ✅","ok"); };
    $("tipoMsg").onchange = ()=>{ $("preview").value = getPlantilla($("tipoMsg").value); };

    $("btnGuardarPaciente").onclick = guardarPaciente;

    $("dlgClose").onclick = ()=>$("dlgFicha").close();

    $("preview").value = getPlantilla($("tipoMsg").value);
    setStatus("Listo. 1) Ping  2) Cargar datos  3) Filtra y envía.", "warn");
    setWriteStatus("Listo para guardar pacientes.", "");
  }
  document.addEventListener("DOMContentLoaded", init);
