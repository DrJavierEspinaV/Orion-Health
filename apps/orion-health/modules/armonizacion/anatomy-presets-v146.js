(()=>{
  'use strict';

  const STORAGE_KEY='orion_aesthetic_procedure_v145';
  const PRESET_VERSION='1.4.6-anatomy-calibration-1';

  const PRESETS={
    forehead:{
      points:[[32,19.5],[41,18.0],[50,17.6],[59,18.0],[68,19.5]],
      labels:['Frontal lateral derecho','Frontal paramediano derecho','Frontal central','Frontal paramediano izquierdo','Frontal lateral izquierdo']
    },
    glabella:{
      points:[[50,34.0],[46.5,30.8],[53.5,30.8],[42.5,29.4],[57.5,29.4]],
      labels:['Prócer','Corrugador derecho medial','Corrugador izquierdo medial','Corrugador derecho lateral','Corrugador izquierdo lateral']
    },
    periocular_r:{
      points:[[20.5,37.5],[18.3,41.4],[20.2,45.2]],
      labels:['Orbicular lateral derecho superior','Orbicular lateral derecho medio','Orbicular lateral derecho inferior']
    },
    periocular_l:{
      points:[[79.5,37.5],[81.7,41.4],[79.8,45.2]],
      labels:['Orbicular lateral izquierdo superior','Orbicular lateral izquierdo medio','Orbicular lateral izquierdo inferior']
    },
    bunny:{
      points:[[47.0,44.0],[53.0,44.0]],
      labels:['Nasal derecho','Nasal izquierdo']
    },
    smile:{
      points:[[43.5,54.2],[56.5,54.2]],
      labels:['Elevador labio–ala nasal derecho','Elevador labio–ala nasal izquierdo']
    },
    dao_r:{
      points:[[37.0,62.2]],
      labels:['DAO derecho']
    },
    dao_l:{
      points:[[63.0,62.2]],
      labels:['DAO izquierdo']
    },
    menton:{
      points:[[47.2,68.2],[52.8,68.2]],
      labels:['Mentoniano derecho','Mentoniano izquierdo']
    },
    masseter_r:{
      points:[[20.0,57.2],[23.0,61.5],[20.5,65.8]],
      labels:['Masetero derecho superior seguro','Masetero derecho medio','Masetero derecho inferior']
    },
    masseter_l:{
      points:[[80.0,57.2],[77.0,61.5],[79.5,65.8]],
      labels:['Masetero izquierdo superior seguro','Masetero izquierdo medio','Masetero izquierdo inferior']
    },
    platysma:{
      points:[[45.5,75.5],[45.5,80.5],[45.5,85.5],[45.5,90.5],[45.5,95.0],[54.5,75.5],[54.5,80.5],[54.5,85.5],[54.5,90.5],[54.5,95.0]],
      labels:['Banda platismal derecha 1','Banda platismal derecha 2','Banda platismal derecha 3','Banda platismal derecha 4','Banda platismal derecha 5','Banda platismal izquierda 1','Banda platismal izquierda 2','Banda platismal izquierda 3','Banda platismal izquierda 4','Banda platismal izquierda 5']
    }
  };

  const LABEL_POSITIONS={
    'Frente':[50,14.0],
    'Glabela / corrugadores':[50,25.0],
    'Periocular derecho':[15,34.0],
    'Periocular izquierdo':[85,34.0],
    'Bunny lines / nasal':[50,41.0],
    'Sonrisa gingival / perioral':[50,51.0],
    'DAO derecho':[34,59.5],
    'DAO izquierdo':[66,59.5],
    'Mentón':[50,65.0],
    'Masetero derecho':[15,54.0],
    'Masetero izquierdo':[85,54.0],
    'Platisma':[50,72.5]
  };

  const uid=()=>`p${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;

  function defaultPoint(zone,xy,label){
    return {
      id:uid(),zone,x:xy[0],y:xy[1],label,
      planned:0,administered:0,status:'suggested',comment:'',source:'preset'
    };
  }

  function calibratedPoints(existing=[]){
    const custom=existing.filter(point=>point&&point.source==='custom');
    const result=[];

    Object.entries(PRESETS).forEach(([zone,definition])=>{
      const previous=existing.filter(point=>point&&point.zone===zone&&point.source!=='custom');
      definition.points.forEach((xy,index)=>{
        const old=previous[index];
        result.push({
          ...defaultPoint(zone,xy,definition.labels[index]),
          ...(old||{}),
          zone,
          x:xy[0],
          y:xy[1],
          label:old?.label||definition.labels[index],
          source:'preset'
        });
      });
    });

    return [...result,...custom];
  }

  function readState(){
    try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');}
    catch(_){return null;}
  }

  function writeState(state){
    try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
    catch(_){return false;}
  }

  function migrate(){
    const state=readState()||{};
    if(state.anatomyPresetVersion===PRESET_VERSION)return;
    state.points=calibratedPoints(Array.isArray(state.points)?state.points:[]);
    state.anatomyPresetVersion=PRESET_VERSION;
    state.selectedPointId=null;
    state.visibleZone=null;
    writeState(state);
  }

  function alignLabels(){
    const layer=document.getElementById('zoneLabelLayer');
    if(!layer)return;
    layer.querySelectorAll('.oa-zone-label').forEach(label=>{
      const position=LABEL_POSITIONS[label.textContent.trim()];
      if(!position)return;
      label.style.left=`${position[0]}%`;
      label.style.top=`${position[1]}%`;
    });
  }

  function installRuntimeHooks(){
    const reset=document.getElementById('btnResetPresets');
    if(reset){
      reset.onclick=()=>{
        if(!confirm('¿Restablecer los puntos anatómicos y eliminar el registro actual de puntos?'))return;
        const state=readState()||{};
        state.points=calibratedPoints([]);
        state.anatomyPresetVersion=PRESET_VERSION;
        state.selectedPointId=null;
        state.selectedZone='glabella';
        state.visibleZone=null;
        writeState(state);
        location.reload();
      };
    }

    const mapText=document.querySelector('.oa-map-head span');
    if(mapText){
      mapText.textContent='Presets anatómico-funcionales editables. Confirma cada ubicación mediante evaluación dinámica, palpación y criterio profesional.';
    }

    alignLabels();
    const layer=document.getElementById('zoneLabelLayer');
    if(layer){
      new MutationObserver(alignLabels).observe(layer,{childList:true,subtree:true});
    }
  }

  migrate();
  window.ORION_AESTHETIC_ANATOMY_V146={version:PRESET_VERSION,presets:PRESETS,calibratedPoints};
  setTimeout(installRuntimeHooks,0);
})();
