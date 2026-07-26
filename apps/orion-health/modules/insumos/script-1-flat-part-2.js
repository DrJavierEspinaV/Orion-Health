    async function loadCatalogoBase(){
      try{
        const response = await fetch('../../data/catalogo-insumos/index.json', { cache:'no-store' });
        if(!response.ok) throw new Error('HTTP '+response.status);
        const payload = await response.json();
        const chunkPaths = Array.isArray(payload.chunks) ? payload.chunks : [];
        const loaded = await Promise.all(chunkPaths.map(path => fetch('../../data/catalogo-insumos/'+path.replace(/^\.\//,'')).then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })));
        const source = loaded.flatMap(part => Array.isArray(part) ? part : (part.items || []));
        if(!Array.isArray(source) || !source.length) throw new Error('Catálogo vacío');
        CODES = source.map(item => ({
          codigo:String(item.codigo || '').trim(),
          nombre_insumo:String(item.nombre_insumo || item.nombre || '').trim(),
          unidad:String(item.unidad || '').trim(),
          tipo:String(item.tipo || '').trim(),
          proveedor:String(item.proveedor || '').trim(),
          costo:item.costo ?? null
        })).filter(item => item.codigo && item.nombre_insumo);
        importInfo.textContent = `Catálogo ORION: ${CODES.length} ítems.`;
        renderOptions(search.value);
        okStatus('Catálogo institucional cargado.');
      }catch(error){
        console.warn('No se pudo cargar el catálogo institucional:', error);
        renderOptions();
        errStatus('Catálogo institucional no disponible; se usa el listado mínimo.');
      }
    }

    // ========= Importador LIVIANO (anti-crash) =========
    const norm = s => String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    function getPreviewMatrix(ws, maxRows=60, maxCols=40){
      const ref = ws["!ref"];
      if (!ref) return { matrix: [], range: null };
      const range = XLSX.utils.decode_range(ref);
      const endR = Math.min(range.e.r, range.s.r + maxRows - 1);
      const endC = Math.min(range.e.c, range.s.c + maxCols - 1);
      const matrix = [];
      for (let r = range.s.r; r <= endR; r++){
        const row = [];
        for (let c = range.s.c; c <= endC; c++){
          const cell = ws[XLSX.utils.encode_cell({r, c})];
          row.push(cell ? (cell.w ?? cell.v ?? "") : "");
        }
        matrix.push(row);
      }
      return { matrix, range };
    }

    function findHeaderRow(preview){
      // busca fila con algo como codigo + insumo/descripcion
      for (let i=0; i<Math.min(25, preview.length); i++){
        const row = preview[i].map(c => norm(c));
        const joined = row.join("|");
        const hasCodigo = row.includes("codigo") || row.includes("sku") || row.includes("sap") || /(^|\|)codigo(\||$)/.test(joined);
        const hasInsumos = row.includes("insumos") || row.includes("insumo") || row.includes("descripcion") || row.includes("descripción") || row.includes("nombre");
        if (hasCodigo && hasInsumos) return i;
      }
      return -1;
    }

    function parseSheet(ws, sheetName){
      const { matrix, range } = getPreviewMatrix(ws);
      if (!matrix.length || !range) return { out: [], truncated: false, scanned: 0 };

      const headerRowLocal = findHeaderRow(matrix);
      // rango total de la hoja
      const totalRows = range.e.r - range.s.r + 1;
      const totalCols = range.e.c - range.s.c + 1;

      // Si no encontramos header, intentamos con sheet_to_json "normal" pero con límite para evitar matar el navegador.
      const MAX_ROWS = 20000; // seguridad dura: si tu excel tiene 300.000 filas, no vamos a suicidar el Chrome.
      const maxEndR = Math.min(range.e.r, range.s.r + MAX_ROWS - 1);
      const truncated = maxEndR < range.e.r;

      // construimos rango string (A1 style)
      const safeRange = XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: maxEndR, c: range.e.c } });

      let rows = [];
      try{
        if (headerRowLocal >= 0){
          const absoluteHeaderRow = range.s.r + headerRowLocal;
          // armamos encabezado desde la preview row (ya está en matrix)
          const header = matrix[headerRowLocal].map(c => String(c||"").trim());
          const dataRange = XLSX.utils.encode_range({
            s: { r: absoluteHeaderRow + 1, c: range.s.c },
            e: { r: maxEndR, c: range.e.c }
          });
          rows = XLSX.utils.sheet_to_json(ws, { header: header, range: dataRange, defval:"", blankrows:false, raw:false });
        } else {
          rows = XLSX.utils.sheet_to_json(ws, { range: safeRange, defval:"", blankrows:false, raw:false });
        }
      }catch(e){
        console.error("parseSheet error", sheetName, e);
        return { out: [], truncated: truncated, scanned: Math.min(totalRows, MAX_ROWS) };
      }

      const out = rows.map(r => {
        const entries = Object.entries(r);
        const get = (names) => {
          for (const [k,v] of entries){
            const nk = norm(k);
            for (const n of names){ if (nk === n || nk.includes(n)) return v; }
          }
          return "";
        };
        const codigo    = String(get(["codigo","sku","sap","cod"])).trim();
        const insumo    = String(get(["insumos","insumo","descripcion","descripción","nombre"])).trim();
        const tipo      = String(get(["tipo","categoria"])).trim();
        const proveedor = String(get(["proveedor"])).trim();
        const unidad    = "";
        if (!codigo || !insumo) return null;
        return { codigo, nombre_insumo: insumo, unidad, tipo, proveedor };
      }).filter(Boolean);

      return { out, truncated, scanned: Math.min(totalRows, MAX_ROWS) };
    }

    function parseWorkbook(workbook){
      let combined = [];
      let truncatedAny = false;
      let scannedTotal = 0;

      for (const sheetName of workbook.SheetNames){
        const ws = workbook.Sheets[sheetName];
        if (!ws) continue;
        const res = parseSheet(ws, sheetName);
        scannedTotal += res.scanned || 0;
        if (res.truncated) truncatedAny = true;
        combined = combined.concat(res.out || []);
      }

      // Dedupe por código (mantiene el primero)
      const map = new Map();
      for (const it of combined){
        if (!map.has(it.codigo)) map.set(it.codigo, it);
      }
      const deduped = Array.from(map.values());

      return { items: deduped, truncatedAny, scannedTotal };
    }

    importBtn.addEventListener('click', () => {
      try{
        if (fileInput.files && fileInput.files.length){
          const file = fileInput.files[0];
          okStatus("Leyendo archivo… (si es gigante, puede demorar un poco, pero no debería botar la página)");
          const reader = new FileReader();
          reader.onload = (evt) => {
            try{
              const data = new Uint8Array(evt.target.result);
              const workbook = XLSX.read(data, { type:'array' });
              const res = parseWorkbook(workbook);
              const out = res.items || [];
              if (!out.length){ errStatus("No se encontraron filas válidas (revisa que existan columnas tipo: CODIGO + INSUMO/DESCRIPCION)."); return; }

              CODES = out;
              const truncTxt = res.truncatedAny ? " (⚠️ importación limitada por tamaño; si faltan ítems, reduce el Excel o divide por proveedor)" : "";
              importInfo.textContent = `Importado: ${CODES.length} ítems desde ${workbook.SheetNames.length} hoja(s).${truncTxt}`;
              renderOptions(search.value);
              okStatus("Archivo importado correctamente.");
            }catch(err){
              console.error(err);
              errStatus("Error al leer el Excel. Abre la consola (F12) para ver detalles.");
            }
          };
          reader.readAsArrayBuffer(file);
        }else{
          fileInput.click();
        }
      }catch(e){
        console.error(e);
        errStatus("Error al iniciar importación.");
      }
    });

    // si seleccionas archivo directo, importamos
    fileInput.addEventListener('change', () => { if(fileInput.files?.length) importBtn.click(); });

    document.getElementById('addBtn').addEventListener('click', addSelected);
    copiarBtn.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(mensaje.value || buildMessage());
        okStatus("Texto copiado.");
      }catch(e){
        errStatus("No se pudo copiar automáticamente (permiso del navegador).");
      }
    });

