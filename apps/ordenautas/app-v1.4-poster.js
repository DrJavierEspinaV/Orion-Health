  function openCatalogEditor(kind,id){
    var existing=kind==="mission"?findMission(id):findReward(id),isNew=!existing;
    $("#catalogEditorKind").value=kind;$("#catalogEditorId").value=existing?existing.id:"";
    $("#catalogEditorTitle").textContent=(isNew?"Nueva ":"Editar ")+(kind==="mission"?"misión":"recompensa");
    $("#catalogEditorSubtitle").textContent=kind==="mission"?"Configura su valor y dónde aparecerá.":"Configura su tipo y costo de canje.";
    $("#catalogEditorName").value=existing?existing.name:"";$("#catalogEditorIcon").value=existing?existing.icon:(kind==="mission"?"✅":"🎁");
    $("#catalogEditorMainValue").value=existing?(kind==="mission"?existing.points:existing.cost):(kind==="mission"?1:5);
    $("#catalogEditorValueLabel").textContent=kind==="mission"?"Puntos de energía":"Costo en puntos";
    $("#missionEditorFields").hidden=kind!=="mission";$("#rewardEditorFields").hidden=kind!=="reward";
    $("#catalogEditorCategory").value=existing&&kind==="mission"?existing.cat:"Orden";$("#catalogEditorTeamPoints").value=existing&&kind==="mission"?existing.team:0;$("#catalogEditorQuick").checked=!!(existing&&kind==="mission"&&existing.quick);
    $("#catalogEditorType").value=existing&&kind==="reward"?existing.type:"Especial";
    setModalOpen($("#catalogEditorModal"),true);setTimeout(function(){$("#catalogEditorName").focus()},100);
  }

  function closeCatalogEditor(){setModalOpen($("#catalogEditorModal"),false);$("#catalogEditorForm").reset()}

  function saveCatalogEditor(e){
    e.preventDefault();
    var kind=$("#catalogEditorKind").value,id=$("#catalogEditorId").value,name=cleanText($("#catalogEditorName").value,45),icon=cleanText($("#catalogEditorIcon").value,8),main=Math.round(safeNumber($("#catalogEditorMainValue").value));
    if(!name||!icon||main<1){showToast("Completa nombre, icono y valor.");return}
    if(kind==="mission"){
      var m=id?findMission(id):null,data={id:m?m.id:uniqueId("mission"),name:name,icon:icon,points:Math.min(999,main),cat:cleanText($("#catalogEditorCategory").value,28)||"General",team:Math.max(0,Math.min(99,Math.round(safeNumber($("#catalogEditorTeamPoints").value)))),quick:$("#catalogEditorQuick").checked};
      if(m)state.missions[state.missions.indexOf(m)]=data;else state.missions.push(data);showToast(m?"Misión actualizada.":"Misión agregada.");
    }else{
      var r=id?findReward(id):null,rewardData={id:r?r.id:uniqueId("reward"),name:name,icon:icon,cost:Math.min(999,main),type:cleanText($("#catalogEditorType").value,28)||"Especial"};
      if(r)state.rewards[state.rewards.indexOf(r)]=rewardData;else state.rewards.push(rewardData);showToast(r?"Recompensa actualizada.":"Recompensa agregada.");
    }
    saveState();closeCatalogEditor();render();
  }

  function deleteMission(id){
    var m=findMission(id);if(!m)return;if(!confirm("¿Eliminar la misión “"+m.name+"”? La bitácora se conservará."))return;
    state.missions=state.missions.filter(function(x){return x.id!==id});saveState();render();showToast("Misión eliminada.");
  }

  function deleteReward(id){
    var r=findReward(id);if(!r)return;if(!confirm("¿Eliminar la recompensa “"+r.name+"”? Los canjes históricos se conservarán."))return;
    state.rewards=state.rewards.filter(function(x){return x.id!==id});saveState();render();showToast("Recompensa eliminada.");
  }

  function collectPosterSettings(){
    var ids=$$("[data-poster-participant]:checked").map(function(x){return x.getAttribute("data-poster-participant")});
    if(!ids.length){showToast("Selecciona al menos un participante.");return false}
    state.poster={
      title:cleanText($("#posterTitle").value,50)||"BASE FAMILIAR",
      subtitle:cleanText($("#posterSubtitle").value,80)||"Pequeñas misiones. Grandes aventuras.",
      expedition:cleanText($("#posterExpedition").value,50)||"Expedición familiar",
      target:Math.max(1,Math.min(999,Math.round(safeNumber($("#posterTarget").value)||45))),
      showRules:$("#posterShowRules").checked,showDate:$("#posterShowDate").checked,participantIds:ids
    };
    saveState();return true;
  }

  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}

  function roundedRect(ctx,x,y,w,h,r,fill,stroke,lineWidth){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=lineWidth||2;ctx.strokeStyle=stroke;ctx.stroke()}
  }

  function wrapLines(ctx,text,maxWidth){
    var words=String(text||"").split(/\s+/),lines=[],line="";
    words.forEach(function(word){var test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test});
    if(line)lines.push(line);return lines;
  }

  function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines){
    var lines=wrapLines(ctx,text,maxWidth);
    if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);while(ctx.measureText(lines[maxLines-1]+"…").width>maxWidth&&lines[maxLines-1].length>1)lines[maxLines-1]=lines[maxLines-1].slice(0,-1);lines[maxLines-1]+="…"}
    lines.forEach(function(line,i){ctx.fillText(line,x,y+i*lineHeight)});return y+lines.length*lineHeight;
  }

  function fitFont(ctx,text,maxWidth,maxSize,minSize,weight,family){
    var size=maxSize;family=family||"system-ui, sans-serif";weight=weight||"800";
    while(size>minSize){ctx.font=weight+" "+size+"px "+family;if(ctx.measureText(String(text)).width<=maxWidth)break;size-=1}
    ctx.font=weight+" "+size+"px "+family;return size;
  }

  function drawStar(ctx,cx,cy,outer,inner,points,fill){
    ctx.beginPath();
    for(var i=0;i<points*2;i++){var radius=i%2===0?outer:inner,angle=-Math.PI/2+i*Math.PI/points,x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }

  function drawStarField(ctx,W,H){
    ctx.fillStyle="#071a30";ctx.fillRect(0,0,W,H);
    for(var i=0;i<145;i++){
      var x=(i*149+37)%W,y=(i*83+53)%H,r=1+((i*11)%4),gold=i%8===0;
      ctx.globalAlpha=.36+((i*19)%55)/100;ctx.fillStyle=gold?"#ffd248":"#d4f2f3";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      if(i%23===0){ctx.globalAlpha=.9;drawStar(ctx,x,y,7,3,5,gold?"#ffd248":"#35c6ca")}
    }
    ctx.globalAlpha=1;
  }

  function drawPlanet(ctx,cx,cy,r,base,accent,ring){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.22);
    if(ring){ctx.strokeStyle=ring;ctx.lineWidth=11;ctx.globalAlpha=.9;ctx.beginPath();ctx.ellipse(0,0,r*1.55,r*.38,0,0,Math.PI*2);ctx.stroke()}
    ctx.globalAlpha=1;var g=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);g.addColorStop(0,accent);g.addColorStop(1,base);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.18)";for(var i=0;i<5;i++){ctx.beginPath();ctx.arc(-r*.45+(i*19)%Math.round(r),-r*.25+(i*27)%Math.round(r*.85),r*.11+(i%2)*3,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }

  function drawWingBadge(ctx,cx,cy){
    ctx.save();ctx.fillStyle="#35c6ca";ctx.strokeStyle="#071a30";ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(cx-55,cy+8);ctx.lineTo(cx-230,cy-15);ctx.lineTo(cx-185,cy+15);ctx.lineTo(cx-55,cy+30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+55,cy+8);ctx.lineTo(cx+230,cy-15);ctx.lineTo(cx+185,cy+15);ctx.lineTo(cx+55,cy+30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#0e314d";ctx.beginPath();ctx.arc(cx,cy+12,55,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#35c6ca";ctx.lineWidth=10;ctx.stroke();
    drawStar(ctx,cx,cy+12,28,13,5,"#fff8e6");ctx.restore();
  }

  function drawHeaderIllustration(ctx,x,y,emoji,size,accent){
    ctx.save();ctx.shadowColor="rgba(0,0,0,.28)";ctx.shadowBlur=16;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y,size*.46,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=accent;ctx.lineWidth=7;ctx.stroke();ctx.font=size+"px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(emoji,x,y+3);ctx.restore();
  }

  function drawDottedLeader(ctx,x1,x2,y,color){
    if(x2<=x1)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.restore();
  }

  function drawPanelHeader(ctx,x,y,w,color,number,icon,title){
    roundedRect(ctx,x,y,w,72,24,color,null);ctx.fillStyle="#fff8e6";ctx.beginPath();ctx.arc(x+47,y+36,24,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.font="900 26px system-ui, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(number,x+47,y+37);ctx.font="28px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.fillText(icon,x+91,y+37);ctx.fillStyle="#fff";ctx.textAlign="left";fitFont(ctx,title,w-150,28,19,"900");ctx.fillText(title,x+122,y+45);ctx.textBaseline="alphabetic";
  }

  function drawListPanel(ctx,x,y,w,h,color,number,icon,title,items,isReward,rowH){
    ctx.save();ctx.shadowColor="rgba(0,0,0,.22)";ctx.shadowBlur=14;ctx.shadowOffsetY=7;roundedRect(ctx,x,y,w,h,26,"#fffaf0",color,6);ctx.shadowColor="transparent";roundedRect(ctx,x+9,y+9,w-18,h-18,20,null,"rgba(16,38,59,.25)",2);drawPanelHeader(ctx,x,y,w,color,number,icon,title);
    var yy=y+103,valueWidth=145,nameMax=w-218;
    if(!items.length){ctx.fillStyle="#687987";ctx.font="700 19px system-ui, sans-serif";ctx.textAlign="center";ctx.fillText("Sin elementos configurados",x+w/2,yy+25);ctx.restore();return}
    items.forEach(function(item,index){
      var centerY=yy+index*rowH;
      ctx.textAlign="left";ctx.textBaseline="middle";ctx.font=Math.max(18,Math.min(25,rowH*.52))+"px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.fillStyle="#10263b";ctx.fillText(item.icon,x+23,centerY);
      ctx.fillStyle="#10263b";var fontSize=clamp(Math.floor(rowH*.39),14,19);fitFont(ctx,item.name,nameMax,fontSize,12,"800");ctx.fillText(item.name,x+64,centerY);
      var label=isReward?item.cost+" puntos":item.points+(item.points===1?" punto":" puntos");
      if(!isReward&&item.team)label=item.points+" pts + "+item.team+" equipo";
      ctx.textAlign="left";fitFont(ctx,item.name,nameMax,fontSize,12,"800");var textWidth=ctx.measureText(item.name).width;
      ctx.textAlign="right";ctx.fillStyle=color;fitFont(ctx,label,valueWidth,18,11,"900");ctx.fillText(label,x+w-22,centerY);
      drawDottedLeader(ctx,x+76+textWidth,x+w-valueWidth-8,centerY+2,color);
      ctx.textBaseline="alphabetic";
    });
    ctx.restore();
  }

  function drawExpeditionPanel(ctx,x,y,w,h){
    var color="#138795";ctx.save();ctx.shadowColor="rgba(0,0,0,.2)";ctx.shadowBlur=12;ctx.shadowOffsetY=6;roundedRect(ctx,x,y,w,h,25,"#fffaf0",color,6);ctx.shadowColor="transparent";drawPanelHeader(ctx,x,y,w,color,"3","🏔️","EXPEDICIÓN FAMILIAR");
    var iconX=x+93,iconY=y+178;ctx.fillStyle="#dff8f8";ctx.beginPath();ctx.arc(iconX,iconY,68,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8fd7dc";ctx.lineWidth=4;ctx.stroke();ctx.font="76px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🏔️",iconX,iconY+4);
    ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#10263b";fitFont(ctx,state.poster.expedition,w-210,29,17,"900");ctx.fillText(state.poster.expedition,x+180,y+130);
    ctx.fillStyle=color;fitFont(ctx,"Meta: "+state.poster.target+" puntos de energía colectiva",w-210,31,17,"900");drawWrapped(ctx,"Meta: "+state.poster.target+" puntos de energía colectiva",x+180,y+174,w-210,35,2);
    ctx.fillStyle="#536b78";ctx.font="700 17px system-ui, sans-serif";drawWrapped(ctx,"Cada Ordenauta aporta energía a la base con sus misiones.",x+180,y+245,w-210,23,2);ctx.restore();
  }

  function drawRulesPanel(ctx,x,y,w,h){
    var color="#10263b";ctx.save();ctx.shadowColor="rgba(0,0,0,.2)";ctx.shadowBlur=12;ctx.shadowOffsetY=6;roundedRect(ctx,x,y,w,h,25,"#fffaf0",color,6);ctx.shadowColor="transparent";drawPanelHeader(ctx,x,y,w,color,"4","🛡️","REGLAS DE LA BASE");
    var rules=["Las misiones se registran al completarlas.","Los premios se canjean con autorización de la Central.","La energía de equipo ayuda a desbloquear expediciones familiares.","Lo más importante es avanzar con constancia y buena actitud."];
    var yy=y+105;ctx.textAlign="left";ctx.font="700 16px system-ui, sans-serif";
    rules.forEach(function(rule,index){ctx.fillStyle="#138795";drawStar(ctx,x+27,yy+index*49-5,9,4,5,"#138795");ctx.fillStyle="#10263b";drawWrapped(ctx,rule,x+48,yy+index*49,w-83,21,2)});
    ctx.font="54px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.textAlign="right";ctx.fillText("🛰️",x+w-20,y+h-22);ctx.restore();
  }

  function drawParticipantCard(ctx,x,y,w,h,p,index){
    ctx.save();ctx.shadowColor="rgba(0,0,0,.18)";ctx.shadowBlur=10;ctx.shadowOffsetY=5;roundedRect(ctx,x,y,w,h,25,"#fffaf0",p.color,6);ctx.shadowColor="transparent";
    var avatarX=x+58,avatarY=y+h/2;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(avatarX,avatarY,43,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=6;ctx.stroke();ctx.font="42px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.avatar,avatarX,avatarY+2);
    ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#10263b";ctx.font="800 17px system-ui, sans-serif";ctx.fillText("Ordenauta "+(index+1)+":",x+115,y+37);ctx.strokeStyle="#10263b";ctx.globalAlpha=.5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+115,y+h-22);ctx.lineTo(x+w-25,y+h-22);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=p.color;fitFont(ctx,p.name,w-155,25,15,"900");ctx.fillText(p.name,x+115,y+h-31);ctx.restore();
  }

  function drawPoster(){
    var canvas=$("#posterCanvas"),ctx=canvas.getContext("2d"),W=1240;
    var participants=state.poster.participantIds.map(findParticipant).filter(function(p){return p&&!p.archived});
    if(!participants.length)participants=activeParticipants();
    var maxRows=Math.max(1,state.missions.length,state.rewards.length),rowH=clamp(Math.floor(590/maxRows),34,50),listH=72+55+maxRows*rowH+28;
    var headerH=315,margin=38,gap=20,lowerH=300,participantRows=Math.max(1,Math.ceil(participants.length/2)),participantH=participants.length?participantRows*108+20:0,footerH=58;
    var H=headerH+listH+24+lowerH+24+participantH+footerH+24;
    canvas.width=W;canvas.height=H;ctx.textBaseline="alphabetic";drawStarField(ctx,W,H);

    drawPlanet(ctx,105,66,45,"#138795","#43d1d0","#4fced5");drawPlanet(ctx,W-102,70,44,"#e65f21","#ff9c35",null);drawWingBadge(ctx,W/2,24);
    drawHeaderIllustration(ctx,73,196,"🧑‍🚀",94,"#138795");drawHeaderIllustration(ctx,W-76,194,"🚀",96,"#ef7c13");
    ctx.save();ctx.textAlign="center";ctx.lineJoin="round";ctx.shadowColor="rgba(0,0,0,.38)";ctx.shadowBlur=10;ctx.shadowOffsetY=8;ctx.font="900 112px Impact, 'Arial Black', system-ui, sans-serif";ctx.strokeStyle="#35c6ca";ctx.lineWidth=28;ctx.strokeText("ORDENAUTAS",W/2,142);ctx.strokeStyle="#071a30";ctx.lineWidth=17;ctx.strokeText("ORDENAUTAS",W/2,142);ctx.fillStyle="#fff8e6";ctx.fillText("ORDENAUTAS",W/2,142);ctx.restore();
    ctx.textAlign="center";ctx.fillStyle="#35c6ca";fitFont(ctx,state.poster.subtitle,W-360,34,20,"900");ctx.fillText(state.poster.subtitle,W/2,197);
    ctx.fillStyle="#fff8e6";fitFont(ctx,state.poster.title.toUpperCase(),W-420,22,14,"900");ctx.fillText(state.poster.title.toUpperCase(),W/2,228);
    roundedRect(ctx,252,246,736,51,21,"#10263b","#35c6ca",5);drawStar(ctx,282,271,11,5,5,"#ffd248");drawStar(ctx,958,271,11,5,5,"#ffd248");ctx.fillStyle="#fff";fitFont(ctx,"Tabla oficial de misiones y recompensas",630,24,15,"900");ctx.fillText("Tabla oficial de misiones y recompensas",W/2,279);

    var y=headerH,colW=(W-margin*2-gap)/2,leftX=margin,rightX=leftX+colW+gap;
    drawListPanel(ctx,leftX,y,colW,listH,"#138795","1","🚩","MISIONES Y PUNTAJES",state.missions,false,rowH);
    drawListPanel(ctx,rightX,y,colW,listH,"#ef7c13","2","🏆","PREMIOS Y CANJES",state.rewards,true,rowH);
    y+=listH+24;

    if(state.poster.showRules){drawExpeditionPanel(ctx,leftX,y,colW,lowerH);drawRulesPanel(ctx,rightX,y,colW,lowerH)}else{drawExpeditionPanel(ctx,margin,y,W-margin*2,lowerH)}
    y+=lowerH+24;

    if(participants.length){
      var cardGap=18,cardW=(W-margin*2-cardGap)/2,cardH=92;
      participants.forEach(function(p,index){var col=index%2,row=Math.floor(index/2),x=margin+col*(cardW+cardGap),yy=y+row*108;if(participants.length===1){x=margin;cardW=W-margin*2}drawParticipantCard(ctx,x,yy,cardW,cardH,p,index)});
      y+=participantH;
    }

    ctx.textAlign="center";ctx.fillStyle="#c9edf0";ctx.font="700 16px system-ui, sans-serif";var footer="ORDENAUTAS · Lámina familiar personalizada";if(state.poster.showDate)footer+=" · "+new Date().toLocaleDateString("es-CL");ctx.fillText(footer,W/2,H-25);
  }

  function downloadPoster(){
    if(!collectPosterSettings())return;drawPoster();
    $("#posterCanvas").toBlob(function(blob){
      if(!blob){showToast("No fue posible generar el PNG.");return}
      var a=document.createElement("a"),url=URL.createObjectURL(blob),slug=cleanText(state.poster.title,50).toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi,"-").replace(/^-|-$/g,"")||"familia";
      a.href=url;a.download="ordenautas-lamina-"+slug+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);showToast("Lámina PNG generada.");
    },"image/png");
  }

  function printPoster(){
    if(!collectPosterSettings())return;drawPoster();
    var data=$("#posterCanvas").toDataURL("image/png"),w=window.open("","_blank");
    if(!w){showToast("El navegador bloqueó la ventana de impresión.");return}
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ordenautas - Lámina familiar</title><style>@page{size:A4 portrait;margin:0}html,body{margin:0;width:100%;height:100%;background:#071a30}body{display:flex;align-items:center;justify-content:center}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}@media print{body{height:100vh}img{width:100%;height:100%;object-fit:contain}}</style></head><body><img src="'+data+'" onload="setTimeout(function(){window.print()},300)"></body></html>');
    w.document.close();
  }

