(function(){
  "use strict";

  var MODE_KEY="ordenautas_interface_mode_v1";
  var SESSION_KEY="ordenautas_adult_unlocked_v1";
  var interfaceMode=readStoredMode();
  var adultUnlocked=readSessionUnlock();
  var pendingMission=null;
  var showAllMissions=false;
  var originalBrandSubtitle="Pequeñas misiones. Grandes aventuras.";

  function readStoredMode(){
    try{var value=localStorage.getItem(MODE_KEY);return value==="child"?"child":"adult"}catch(e){return "adult"}
  }
  function readSessionUnlock(){
    try{return sessionStorage.getItem(SESSION_KEY)==="1"}catch(e){return false}
  }
  function storeMode(){try{localStorage.setItem(MODE_KEY,interfaceMode)}catch(e){}}
  function storeUnlock(){try{sessionStorage.setItem(SESSION_KEY,adultUnlocked?"1":"0")}catch(e){}}
  function setInterfaceMode(mode){
    interfaceMode=mode==="child"?"child":"adult";
    if(interfaceMode==="child"){adultUnlocked=false;storeUnlock()}
    storeMode();
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function setAdultUnlocked(value){adultUnlocked=!!value;storeUnlock();renderParentExperience()}

  function injectStyles(){
    if(document.getElementById("ordenautasV16Styles"))return;
    var style=document.createElement("style");
    style.id="ordenautasV16Styles";
    style.textContent=`
      .interface-switch{display:flex;gap:3px;padding:3px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:13px}
      .interface-mode-btn{border:0;background:transparent;color:#d7edf2;border-radius:9px;padding:7px 8px;font-size:9px;font-weight:900;white-space:nowrap;min-height:34px}
      .interface-mode-btn.active{background:#fff;color:var(--navy);box-shadow:0 5px 14px rgba(0,0,0,.16)}
      body.ord-mode-adult .profile-tabs-wrap,body.ord-mode-adult main,body.ord-mode-adult .dock-wrap{display:none!important}
      body.ord-mode-adult .app{padding-bottom:24px}
      #adultDashboard{display:none;padding:14px 14px 5px}
      body.ord-mode-adult #adultDashboard{display:block}
      .adult-shell{display:flex;flex-direction:column;gap:11px}
      .adult-hero-card{background:linear-gradient(145deg,#10263b,#183f5d);color:#fff;border-radius:22px;padding:16px;box-shadow:var(--shadow)}
      .adult-hero-card h2{font-size:18px;margin:0 0 4px}.adult-hero-card p{font-size:10px;color:#cde7ee;margin:0;line-height:1.45}
      .adult-lock{background:#fff;border:1px solid var(--line);border-radius:20px;padding:17px;box-shadow:var(--shadow)}
      .adult-lock-icon{width:58px;height:58px;border-radius:19px;background:var(--cyan-soft);display:grid;place-items:center;font-size:29px;margin-bottom:12px}
      .adult-lock h3{margin:0 0 5px;font-size:16px}.adult-lock p{margin:0 0 13px;color:var(--muted);font-size:10px;line-height:1.45}
      .adult-pin-row{display:grid;grid-template-columns:1fr auto;gap:8px}.adult-pin-row input{border:1px solid var(--line);border-radius:13px;padding:11px;font-size:18px;min-width:0}.adult-pin-row button{border:0;border-radius:13px;background:var(--navy);color:#fff;padding:0 15px;font-weight:900}
      .adult-profile-tabs{display:flex;gap:8px;overflow:auto;scrollbar-width:none;padding:1px 1px 3px}.adult-profile-tabs::-webkit-scrollbar{display:none}
      .adult-profile-btn{min-width:126px;border:2px solid transparent;background:#fff;border-radius:16px;padding:9px;display:flex;align-items:center;gap:8px;text-align:left;box-shadow:0 7px 20px rgba(16,38,59,.08)}
      .adult-profile-btn.active{border-color:var(--cyan);background:#f8ffff}.adult-profile-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:21px;flex:0 0 auto}.adult-profile-btn strong{display:block;font-size:11px}.adult-profile-btn small{display:block;font-size:8px;color:var(--muted);margin-top:2px}
      .adult-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.adult-stat{background:#fff;border:1px solid var(--line);border-radius:15px;padding:10px 6px;text-align:center}.adult-stat b{display:block;font-size:17px;color:var(--navy)}.adult-stat small{display:block;font-size:7px;color:var(--muted);font-weight:900;margin-top:2px}
      .adult-card{background:#fff;border:1px solid var(--line);border-radius:19px;padding:13px;box-shadow:0 8px 24px rgba(16,38,59,.07)}
      .adult-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:9px;margin-bottom:10px}.adult-card-head h3{font-size:13px;margin:0}.adult-card-head span{font-size:9px;color:var(--muted);text-align:right}.adult-card-head button{border:0;background:var(--cyan-soft);color:#08757a;border-radius:9px;padding:6px 8px;font-size:9px;font-weight:900}
      .adult-rank-row{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center}.adult-rank-icon{width:46px;height:46px;border-radius:15px;background:linear-gradient(145deg,#f7c541,#ea8d1e);display:grid;place-items:center;font-size:25px}.adult-rank-copy strong{display:block;font-size:12px}.adult-rank-copy small{display:block;color:var(--muted);font-size:9px;line-height:1.35;margin-top:3px}.adult-rank-number{font-size:9px;font-weight:900;color:#8a5a00;background:#fff4d4;border-radius:99px;padding:6px 8px}
      .adult-team{background:linear-gradient(145deg,#fff7df,#fff);border-color:#ecd28c}.adult-team-line{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}.adult-team-line strong{font-size:13px}.adult-team-line b{font-size:23px;color:#965a00}.adult-team-status{font-size:9px;color:#75581a;margin-top:6px}.adult-team-status.ready{color:#0a7651;font-weight:900}
      .adult-mission-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.adult-mission-btn{border:1px solid var(--line);background:#f9fbfb;border-radius:15px;padding:10px;text-align:left;min-height:88px;display:flex;flex-direction:column;justify-content:space-between}.adult-mission-btn:active{transform:scale(.975)}.adult-mission-icon{font-size:22px}.adult-mission-name{font-size:10px;font-weight:850;line-height:1.25;margin:5px 0}.adult-mission-value{align-self:flex-end;font-size:9px;font-weight:900;color:#08757a;background:var(--cyan-soft);border-radius:99px;padding:4px 7px}
      .adult-history{display:flex;flex-direction:column;gap:7px}.adult-history-item{display:grid;grid-template-columns:33px 1fr auto;gap:8px;align-items:center;border-top:1px solid #edf1f3;padding-top:7px}.adult-history-item:first-child{border-top:0;padding-top:0}.adult-history-icon{width:33px;height:33px;border-radius:11px;background:#edf5f6;display:grid;place-items:center}.adult-history-item strong{display:block;font-size:10px}.adult-history-item small{display:block;color:var(--muted);font-size:8px;margin-top:2px}.adult-history-delta{font-size:10px;font-weight:900}.adult-history-delta.plus{color:var(--green)}.adult-history-delta.minus{color:var(--red)}
      .adult-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.adult-action{border:0;border-radius:14px;padding:11px 8px;font-size:10px;font-weight:900;background:#edf2f4;color:var(--navy)}.adult-action.primary{background:var(--navy);color:#fff}.adult-action.orange{background:var(--orange);color:#fff}.adult-action.cyan{background:var(--cyan);color:var(--navy)}
      .adult-control-note{font-size:9px;line-height:1.45;color:#526a77;background:#eef7f7;border:1px solid #d4e9e9;border-radius:13px;padding:10px}
      .mission-approval-sheet{text-align:center}.mission-approval-icon{width:72px;height:72px;margin:3px auto 10px;border-radius:23px;background:var(--cyan-soft);display:grid;place-items:center;font-size:38px}.mission-approval-sheet h2{font-size:18px}.mission-approval-sheet p{line-height:1.45}.mission-approval-sheet .field{text-align:left}
      @media(max-width:430px){.hero .brandrow{align-items:flex-start;flex-wrap:wrap}.header-actions{width:100%;justify-content:space-between}.interface-switch{flex:1}.interface-mode-btn{flex:1;padding:7px 6px;font-size:8px}.adult-stats{grid-template-columns:1fr 1fr}.adult-actions{grid-template-columns:1fr}.adult-mission-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectInterface(){
    var actions=document.querySelector(".header-actions");
    if(actions&&!document.getElementById("interfaceSwitcher")){
      var switcher=document.createElement("div");switcher.id="interfaceSwitcher";switcher.className="interface-switch";
      switcher.innerHTML='<button class="interface-mode-btn" data-interface-mode="adult" type="button">👨‍👩‍👧 Adulto</button><button class="interface-mode-btn" data-interface-mode="child" type="button">🧑‍🚀 Ordenauta</button>';
      actions.insertBefore(switcher,actions.firstChild);
    }

    if(!document.getElementById("adultDashboard")){
      var dashboard=document.createElement("section");dashboard.id="adultDashboard";
      dashboard.innerHTML='<div class="adult-shell"><div class="adult-hero-card"><h2>Control familiar</h2><p>Registra las misiones desde el celular del adulto. El modo Ordenauta queda disponible como experiencia opcional y siempre exige validación parental para sumar puntos.</p></div><div class="adult-lock" id="adultLockPanel"><div class="adult-lock-icon">🔐</div><h3>Desbloquear modo adulto</h3><p>Ingresa el PIN parental para registrar misiones, revisar el progreso y administrar la base durante esta sesión.</p><div class="adult-pin-row"><input id="adultPinInput" inputmode="numeric" maxlength="6" placeholder="PIN parental" type="password"/><button id="unlockAdultMode" type="button">Ingresar</button></div><button class="adult-action" data-interface-mode="child" style="width:100%;margin-top:9px" type="button">Abrir modo Ordenauta</button></div><div id="adultControlPanel" hidden><div class="adult-profile-tabs" id="adultProfileTabs"></div><div class="adult-stats" id="adultStats"></div><div class="adult-card" id="adultRankCard"></div><div class="adult-card adult-team" id="adultTeamCard"></div><div class="adult-card"><div class="adult-card-head"><div><h3>Registrar misión</h3><span>Toca una misión completada por el participante activo.</span></div><button id="toggleAdultMissions" type="button">Ver todas</button></div><div class="adult-mission-grid" id="adultMissionGrid"></div></div><div class="adult-card"><div class="adult-card-head"><div><h3>Actividad reciente</h3><span>Últimos movimientos de la familia.</span></div></div><div class="adult-history" id="adultHistory"></div></div><div class="adult-actions"><button class="adult-action primary" data-adult-action="central" type="button">🛰️ Abrir Central</button><button class="adult-action cyan" data-adult-action="poster" type="button">🖨️ Lámina oficial</button><button class="adult-action orange" data-adult-action="family" type="button">🏆 Premio Familiar</button><button class="adult-action" data-interface-mode="child" type="button">🧑‍🚀 Modo Ordenauta</button><button class="adult-action" data-adult-action="lock" type="button">🔒 Bloquear modo adulto</button></div><div class="adult-control-note">El modo adulto es la interfaz principal. El modo Ordenauta sirve para mostrar avances o permitir interacción supervisada; las misiones no suman puntos sin el PIN parental.</div></div></div>';
      var app=document.querySelector(".app"),profiles=document.querySelector(".profile-tabs-wrap");app.insertBefore(dashboard,profiles);
    }

    if(!document.getElementById("missionApprovalModal")){
      var modal=document.createElement("div");modal.id="missionApprovalModal";modal.className="modal";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");
      modal.innerHTML='<div class="sheet mission-approval-sheet"><button aria-label="Cerrar" class="icon-close" id="closeMissionApprovalX" style="float:right" type="button">×</button><div class="mission-approval-icon" id="missionApprovalIcon">✅</div><h2>Misión lista para validar</h2><p id="missionApprovalText"></p><div class="field"><label for="missionApprovalPin">PIN parental</label><input autocomplete="off" id="missionApprovalPin" inputmode="numeric" maxlength="6" placeholder="••••" type="password"/></div><div class="btn-row"><button class="btn secondary" id="cancelMissionApproval" type="button">Cancelar</button><button class="btn primary" id="confirmMissionApproval" type="button">Validar misión</button></div></div>';
      document.body.appendChild(modal);
    }
  }

  function renderParentExperience(){
    document.body.classList.toggle("ord-mode-adult",interfaceMode==="adult");
    document.body.classList.toggle("ord-mode-child",interfaceMode==="child");
    document.querySelectorAll("[data-interface-mode]").forEach(function(button){button.classList.toggle("active",button.getAttribute("data-interface-mode")===interfaceMode)});
    var subtitle=document.querySelector(".brand p");if(subtitle)subtitle.textContent=interfaceMode==="adult"?"Control parental de misiones y recompensas.":originalBrandSubtitle;
    document.querySelectorAll(".version-note").forEach(function(node){node.textContent="ORDENAUTAS · Piloto familiar V1.6"});

    var lock=document.getElementById("adultLockPanel"),panel=document.getElementById("adultControlPanel");
    if(!lock||!panel)return;
    lock.hidden=adultUnlocked;panel.hidden=!adultUnlocked;
    if(!adultUnlocked)return;

    var p=currentParticipant(),info=levelInfo(p.historical),participants=activeParticipants();
    document.getElementById("adultProfileTabs").innerHTML=participants.map(function(person){return'<button class="adult-profile-btn '+(person.id===p.id?'active':'')+'" data-adult-player="'+escapeHtml(person.id)+'" type="button"><span class="adult-profile-avatar" style="background:'+person.color+'">'+escapeHtml(person.avatar)+'</span><span><strong>'+escapeHtml(person.name)+'</strong><small>'+person.available+' energía · '+person.historical+' XP</small></span></button>'}).join("");
    document.getElementById("adultStats").innerHTML='<div class="adult-stat"><b>'+p.available+'</b><small>ENERGÍA</small></div><div class="adult-stat"><b>'+p.historical+'</b><small>XP TOTAL</small></div><div class="adult-stat"><b>'+p.streak+'</b><small>RACHA</small></div><div class="adult-stat"><b>'+state.teamPoints+'</b><small>BASE</small></div>';
    document.getElementById("adultRankCard").innerHTML='<div class="adult-card-head"><div><h3>Rango actual</h3><span>Progreso individual de '+escapeHtml(p.name)+'.</span></div><button data-adult-action="ranks" type="button">Ver rangos</button></div><div class="adult-rank-row"><div class="adult-rank-icon">'+escapeHtml(info.level.icon||"🚀")+'</div><div class="adult-rank-copy"><strong>'+escapeHtml(info.level.name)+'</strong><small>'+escapeHtml(info.level.benefit||"Completa misiones para avanzar.")+'</small><div class="bar"><i style="width:'+info.progress+'%"></i></div></div><div class="adult-rank-number">Rango '+(info.index+1)+'</div></div>';
    var ready=state.teamPoints>=state.poster.target,percent=Math.min(100,state.teamPoints/state.poster.target*100);
    document.getElementById("adultTeamCard").innerHTML='<div class="adult-card-head"><div><h3>Expedición familiar</h3><span>'+escapeHtml(state.poster.expedition)+'</span></div></div><div class="adult-team-line"><strong>Meta colectiva</strong><b>'+state.teamPoints+' / '+state.poster.target+'</b></div><div class="bar"><i style="width:'+percent+'%"></i></div><div class="adult-team-status '+(ready?'ready':'')+'">'+(ready?'🏆 Premio Familiar desbloqueado':'Faltan '+Math.max(0,state.poster.target-state.teamPoints)+' puntos para la entrega familiar')+'</div>';

    var missions=showAllMissions?state.missions:state.missions.filter(function(m){return m.quick}).slice(0,6);if(!missions.length)missions=state.missions.slice(0,6);
    document.getElementById("toggleAdultMissions").textContent=showAllMissions?"Ver rápidas":"Ver todas";
    document.getElementById("adultMissionGrid").innerHTML=missions.map(function(m){return'<button class="adult-mission-btn" data-parent-mission="'+escapeHtml(m.id)+'" type="button"><span class="adult-mission-icon">'+escapeHtml(m.icon)+'</span><span class="adult-mission-name">'+escapeHtml(m.name)+'</span><span class="adult-mission-value">+'+m.points+(m.team?' · +'+m.team+' base':'')+'</span></button>'}).join("");

    var recent=state.history.slice(0,6);document.getElementById("adultHistory").innerHTML=recent.length?recent.map(function(h){var owner=findParticipant(h.who),icon=h.type==="mission"?"✅":h.type==="reward"?"🎁":h.type==="rank"?"⭐":h.type==="family"?"🏆":"⚙️";return'<div class="adult-history-item"><div class="adult-history-icon">'+icon+'</div><div><strong>'+escapeHtml(h.label)+'</strong><small>'+escapeHtml(owner?owner.name:"Base familiar")+' · '+escapeHtml(h.date||"")+'</small></div><div class="adult-history-delta '+(h.delta>=0?'plus':'minus')+'">'+(h.delta>=0?'+':'')+h.delta+'</div></div>'}).join(""):'<div class="empty">Todavía no hay movimientos registrados.</div>';
  }

  function unlockAdult(){
    var input=document.getElementById("adultPinInput");
    if(input.value!==state.pin){showToast("PIN incorrecto.");input.select();return}
    input.value="";setAdultUnlocked(true);showToast("Modo adulto desbloqueado para esta sesión.")
  }
  function lockAdult(){setAdultUnlocked(false);showToast("Modo adulto bloqueado.")}
  function openAdultCentral(panel){centralPanel=panel||"participants";openParent()}

  function openMissionApproval(mission){
    pendingMission=mission;document.getElementById("missionApprovalIcon").textContent=mission.icon;document.getElementById("missionApprovalText").textContent=currentParticipant().name+' completó “'+mission.name+'”. Un adulto debe validar para sumar '+mission.points+' punto'+(mission.points===1?'':'s')+' de energía.';document.getElementById("missionApprovalPin").value="";setModalOpen(document.getElementById("missionApprovalModal"),true);setTimeout(function(){document.getElementById("missionApprovalPin").focus()},100)
  }
  function closeMissionApproval(){setModalOpen(document.getElementById("missionApprovalModal"),false);pendingMission=null}

  injectStyles();injectInterface();

  var previousOpenParent=openParent;
  openParent=function(){
    if(interfaceMode==="adult"&&adultUnlocked){
      document.getElementById("pinGate").style.display="none";document.getElementById("parentPanel").classList.add("unlocked");setModalOpen(document.getElementById("parentModal"),true);setCentralPanel(centralPanel);renderCentral();return;
    }
    previousOpenParent();
  };

  var validatedCompleteMission=completeMission;
  completeMission=function(mission){
    if(!mission)return;
    if(interfaceMode==="child"){openMissionApproval(mission);return}
    if(!adultUnlocked){showToast("Desbloquea el modo adulto para registrar misiones.");return}
    validatedCompleteMission(mission);
  };

  var previousRender=render;
  render=function(){previousRender();renderParentExperience()};

  document.addEventListener("click",function(e){
    var button=e.target.closest("[data-interface-mode]");if(button){setInterfaceMode(button.getAttribute("data-interface-mode"));return}
    button=e.target.closest("[data-adult-player]");if(button){state.activeParticipantId=button.getAttribute("data-adult-player");saveState();render();return}
    button=e.target.closest("[data-parent-mission]");if(button){if(!adultUnlocked){showToast("Desbloquea el modo adulto.");return}var mission=findMission(button.getAttribute("data-parent-mission"));if(mission)validatedCompleteMission(mission);return}
    button=e.target.closest("[data-adult-action]");if(button){var action=button.getAttribute("data-adult-action");if(action==="central")openAdultCentral("participants");else if(action==="poster")openAdultCentral("poster");else if(action==="family")openAdultCentral("progress");else if(action==="ranks"){var rankButton=document.getElementById("openRanks");if(rankButton)rankButton.click()}else if(action==="lock")lockAdult();return}
  });

  document.getElementById("unlockAdultMode").addEventListener("click",unlockAdult);
  document.getElementById("adultPinInput").addEventListener("keydown",function(e){if(e.key==="Enter")unlockAdult()});
  document.getElementById("toggleAdultMissions").addEventListener("click",function(){showAllMissions=!showAllMissions;renderParentExperience()});
  document.getElementById("cancelMissionApproval").addEventListener("click",closeMissionApproval);
  document.getElementById("closeMissionApprovalX").addEventListener("click",closeMissionApproval);
  document.getElementById("missionApprovalModal").addEventListener("click",function(e){if(e.target===this)closeMissionApproval()});
  document.getElementById("confirmMissionApproval").addEventListener("click",function(){var input=document.getElementById("missionApprovalPin");if(input.value!==state.pin){showToast("PIN incorrecto.");input.select();return}var mission=pendingMission;closeMissionApproval();if(mission)validatedCompleteMission(mission)});
  document.getElementById("missionApprovalPin").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("confirmMissionApproval").click()});
  document.getElementById("unlockParent").addEventListener("click",function(){setTimeout(function(){if(document.getElementById("parentPanel").classList.contains("unlocked")){adultUnlocked=true;storeUnlock();renderParentExperience()}},0)});

  render();
})();
