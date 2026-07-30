(()=>{
  'use strict';

  const directChild=(element,parent)=>{
    let node=element;
    while(node&&node.parentElement!==parent)node=node.parentElement;
    return node&&node.parentElement===parent?node:null;
  };

  function init(){
    if(document.getElementById('orionPatientPriorityControls'))return;

    const sidebar=document.querySelector('.crm-sidebar');
    const controlsCard=sidebar?.querySelector(':scope > .card:not(.table)');
    const tableCard=sidebar?.querySelector(':scope > .card.table');
    const bar=controlsCard?.querySelector('.bar');
    if(!sidebar||!controlsCard||!tableCard||!bar)return;

    document.body.classList.add('orion-communications-patients-first');
    sidebar.setAttribute('aria-label','Pacientes, agenda y lista clínica');
    tableCard.setAttribute('aria-label','Lista de pacientes');

    const qBlock=directChild(document.getElementById('q'),bar);
    const statusBlock=directChild(document.getElementById('showFilter'),bar);
    const exportBlock=directChild(document.getElementById('export'),bar);
    const fileBlock=directChild(document.getElementById('file'),bar);
    const driveBlock=directChild(document.querySelector('.bdCard'),bar);
    const dateRow=controlsCard.querySelector('.date-filter-row');
    const todayChip=document.getElementById('filterTodayLabel');
    const slotCard=document.getElementById('franjaPacienteCard');
    const documentStatus=document.getElementById('documentoStatus');
    const themeToggle=document.getElementById('toggleTheme');
    const themeRow=themeToggle?.parentElement;

    const priority=document.createElement('section');
    priority.id='orionPatientPriorityControls';
    priority.className='orion-patient-priority-controls';
    priority.innerHTML=`<div class="orion-priority-heading"><div><strong>Pacientes y agenda</strong><span>Primero selecciona al paciente; después prepara el mensaje</span></div></div><div class="orion-priority-search" id="orionPrioritySearch"></div>`;
    controlsCard.prepend(priority);

    const searchGrid=priority.querySelector('#orionPrioritySearch');
    [qBlock,statusBlock,exportBlock].filter(Boolean).forEach(node=>searchGrid.appendChild(node));
    [dateRow,todayChip,slotCard,documentStatus].filter(Boolean).forEach(node=>priority.appendChild(node));

    const dataPanel=document.createElement('details');
    dataPanel.id='orionDataSourcePanel';
    dataPanel.className='card orion-data-source-panel';
    dataPanel.innerHTML=`<summary><span class="orion-data-source-title">⚙️ Fuente de datos y conexión</span><span class="orion-data-source-status" id="orionDataSourceStatus">Estado pendiente</span></summary><div class="orion-data-source-body"><div class="orion-data-source-grid" id="orionDataSourceGrid"></div></div>`;
    sidebar.insertBefore(dataPanel,tableCard.nextSibling);

    const dataGrid=dataPanel.querySelector('#orionDataSourceGrid');
    [fileBlock,driveBlock].filter(Boolean).forEach(node=>dataGrid.appendChild(node));
    if(themeRow)dataPanel.querySelector('.orion-data-source-body').appendChild(themeRow);
    if(!bar.children.length)bar.remove();

    const summaryStatus=document.getElementById('orionDataSourceStatus');
    const driveBadge=document.getElementById('orionDriveStatusBadge');
    const driveText=document.getElementById('orionDriveStatusText');
    const syncStatus=()=>{
      if(!summaryStatus)return;
      const badge=String(driveBadge?.textContent||'').trim();
      const text=String(driveText?.textContent||'').trim();
      const value=badge||(/cargad|conectad|ok|listo/i.test(text)?'Conectado':/error|revisar|token|timeout|no se pudo/i.test(text)?'Revisar acceso':'Estado pendiente');
      summaryStatus.textContent=value;
      summaryStatus.className='orion-data-source-status';
      if(/conectado|listo/i.test(value))summaryStatus.classList.add('ready');
      else if(/revisar|error|timeout|no se pudo/i.test(`${value} ${text}`))summaryStatus.classList.add('error');
      else summaryStatus.classList.add('pending');
    };
    syncStatus();
    [driveBadge,driveText].filter(Boolean).forEach(node=>new MutationObserver(syncStatus).observe(node,{childList:true,subtree:true,characterData:true}));

    window.ORION_COMMUNICATIONS_PRIORITY_LAYOUT={version:'1.4.3',status:'PATIENTS_LIST_FIRST_MESSAGES_AFTER'};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();