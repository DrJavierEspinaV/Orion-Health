/* Mantener el valor de la fuente; el color nunca modifica el estado clínico/administrativo. */
(()=>{
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ').trim();
  const aliases=['texto status consulta','texto estado consulta','estado de la cita','estado cita','estado de cita','status consulta','estado consulta','status','estado'];
  function fromRow(row={}){
    const entries=Object.entries(row);
    for(const alias of aliases){
      const entry=entries.find(([key,value])=>normalize(key)===alias&&String(value??'').trim()!=='');
      if(entry)return String(entry[1]).trim();
    }
    return '';
  }
  function category(value){
    const text=normalize(value);
    if(/^(ausente|no asistio|no asiste|inasistente|inasistencia|no presentado|no se presento)\b/.test(text))return 'ausente';
    if(/^(atendido|atendida|asistio|asistido|asistida|confirmado|confirmada|aceptado|aceptada|finalizado|finalizada|realizado|realizada)\b/.test(text))return 'ok';
    return 'info';
  }
  globalThis.ORION_APPOINTMENT_STATUS={fromRow,category};
})();
