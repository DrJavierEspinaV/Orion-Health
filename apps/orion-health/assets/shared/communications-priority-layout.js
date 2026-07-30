(()=>{
  'use strict';

  const MOBILE_BREAKPOINT=900;
  const directChild=(element,parent)=>{
    let node=element;
    while(node&&node.parentElement!==parent)node=node.parentElement;
    return node&&node.parentElement===parent?node:null;
  };

  const effectiveWidth=()=>{
    const widths=[window.innerWidth,document.documentElement?.clientWidth].filter(Number.isFinite);
    try{
      if(window.parent&&window.parent!==window&&Number.isFinite(window.parent.innerWidth))widths.push(window.parent.innerWidth);
    }catch(_){ }
    return Math.min(...widths.filter(value=>value>0));
  };

  function init(){
    const layout=document.querySelector('.crm-layout');
    const sidebar=document.querySelector('.crm-sidebar');
    const left=document.querySelector('.crm-left');
    const controlsCard=sidebar?.querySelector(':scope > .card:not(.table)');
    const tableCard=sidebar?.querySelector(':scope > .card.table');
    const bar=controlsCard?.querySelector('.bar');
    if(!layout||!sidebar||!left||!controlsCard||!tableCard||!bar)return;

    document.body.classList.add('orion-communications-patients-first');
    sidebar.setAttribute('aria-label','Pacientes, agenda y lista clínica');
    tableCard.setAttribute('aria-label','Lista de pacientes');

    let priority=document.getElementById('orionPatientPriorityControls');
    let dataPanel=document.getElementById('orionDataSourcePanel');

    if(!priority){
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

      priority=document.createElement('section');
      priority.id='orionPatientPriorityControls';
      priority.className='orion-patient-priority-controls';
      priority.innerHTML='<div class="orion-priority-heading"><div><strong>Pacientes y agenda</strong><span>Búsqueda, fechas y lista clínica</span></div></div><div class="orion-priority-search" id="orionPrioritySearch"></div>';
      controlsCard.prepend(priority);

      const searchGrid=priority.querySelector('#orionPrioritySearch');
      [qBlock,statusBlock,exportBlock].filter(Boolean).forEach(node=>searchGrid.appendChild(node));
      [dateRow,todayChip,slotCard,documentStatus].filter(Boolean).forEach(node=>priority.appendChild(node));

      dataPanel=document.createElement('details');
      dataPanel.id='orionDataSourcePanel';
      dataPanel.className='card orion-data-source-panel';
      dataPanel.dataset.orionPlacement='layout-footer';
      dataPanel.innerHTML='<summary><span class="orion-data-source-title">⚙️ Fuente de datos y conexión</span><span class="orion-data-source-status" id="orionDataSourceStatus">Estado pendiente</span></summary><div class="orion-data-source-body"><div class="orion-data-source-grid" id="orionDataSourceGrid"></div></div>';
      layout.appendChild(dataPanel);

      const dataGrid=dataPanel.querySelector('#orionDataSourceGrid');
      [fileBlock,driveBlock].filter(Boolean).forEach(node=>dataGrid.appendChild(node));
      if(themeRow)dataPanel.querySelector('.orion-data-source-body').appendChild(themeRow);
      if(!bar.children.length)bar.remove();
    }

    const list=document.getElementById('list');
    const cellClasses=['patient-main','patient-run','patient-date','patient-time','patient-status','patient-motive'];
    const decorateRows=()=>{
      list?.querySelectorAll(':scope > .row').forEach(row=>{
        [...row.children].forEach((cell,index)=>{
          const className=cellClasses[index];
          if(className)cell.classList.add(className);
        });
      });
    };
    decorateRows();
    if(list)new MutationObserver(decorateRows).observe(list,{childList:true});

    const placeResponsive=()=>{
      const mobile=effectiveWidth()<=MOBILE_BREAKPOINT;
      document.body.classList.toggle('orion-communications-mobile',mobile);
      if(mobile){
        if(sidebar.nextElementSibling!==left)layout.insertBefore(sidebar,left);
        if(dataPanel?.parentElement!==layout)layout.appendChild(dataPanel);
        dataPanel?.classList.add('orion-data-source-detached');
        if(dataPanel)dataPanel.open=false;
      }else{
        if(left.nextElementSibling!==sidebar)layout.insertBefore(left,sidebar);
        if(dataPanel?.parentElement!==layout)layout.appendChild(dataPanel);
        dataPanel?.classList.remove('orion-data-source-detached');
      }
    };
    placeResponsive();
    window.addEventListener('resize',placeResponsive,{passive:true});

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

    window.ORION_COMMUNICATIONS_PRIORITY_LAYOUT={version:'1.4.2',status:'AGENDA_LIST_MESSAGES_DATA_SOURCE',effectiveWidth};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
