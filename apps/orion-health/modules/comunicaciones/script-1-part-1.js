

const plantillas = {
  ausente: `Hola {{PACIENTE}}, soy el Dr. Javier Espina Videla (Cirugía Maxilofacial – IntegraMédica Mall Tobalaba).

Notamos que no asististe a tu cita del {{FECHA_HORA}}.
Si deseas reprogramarla, puedes hacerlo aquí:
📅 https://agenda.bupa.cl/integramedica/agenda-consulta-dental/reserva-consulta-dental

Podemos conversar vía Whatsapp, para conocer su Motivo de Consulta?

Para mayor comodidad, si cuenta con un examen radiográfico, podemos enviar una orientación de presupuesto por este mismo medio, evitando una asistencia presencial innecesaria.

La consulta presencial quedaría recomienda solo si hay dolor, inflamación, infección, antecedentes médicos relevantes o si se requiere una evaluación clínica más detallada.`,

  consentimiento: `Hola {{PACIENTE}}, Adjunto encontrará el Consentimiento Informado correspondiente a su procedimiento.
Le recomiendo leerlo con calma antes de la cita del día {{FECHA_HORA}}, ya que contiene información importante sobre el tratamiento, sus beneficios y posibles riesgos.

Cualquier duda que tenga será resuelta personalmente el día del procedimiento, para que pueda sentirse seguro(a) y con toda la información necesaria.

Muchas gracias por su confianza.

{{ADJUNTOS}}`,

  indicaciones: `Hola {{PACIENTE}}, te envío las Indicaciones Pre y Postoperatorias relacionadas con tu procedimiento.
Es muy importante que las leas con calma y las sigas al pie de la letra ✅, ya que ayudan a que la cirugía y la recuperación sean seguras y exitosas.

Si surge cualquier duda, puedes escribirme antes de la intervención o la resolveremos en la consulta.
{{ADJUNTOS}}`,

  infografia: `Hola {{PACIENTE}}, te comparto esta infografía de Salud Bucomaxilofacial 🦷.
Está diseñada para entregarte información clara y sencilla.

Léela con calma, puede ayudarte a cuidar mejor tu salud oral y resolver dudas frecuentes.

Cualquier consulta, escríbeme con confianza.
{{ADJUNTOS}}`,

  promocion: `Hola {{PACIENTE}}, en Integramédica tenemos una Promoción Especial 🦷✨.
Te envío el detalle en la imagen adjunta 📄.
Si te interesa reservar tu hora, respóndeme a este WhatsApp y coordinamos.
{{ADJUNTOS}}`,

  derivacion_whatsapp: `Estimado(a) {{PACIENTE}}, le escribe el Dr. Javier Espina, por Indicación y/o Derivación del(a) {{DERIVADOR}}. para la Evaluación y Tratamiento de
{{INDICACION}}

Con el Examen Radiográfico (adjunto) y Evaluación de la Ficha Clínica, es posible realizar una revisión preliminar y enviar una orientación de presupuesto por este medio, sin necesidad de asistir presencialmente si no existen síntomas o dudas clínicas específicas.

La evaluación presencial queda indicada en caso de dolor, inflamación, infección, antecedentes médicos relevantes o si se requiere una revisión clínica directa.


Quedo atento(a) a sus comentarios.

Adjunto Documentos.`
};

let DATA = [];
let activeDocumentoRut = '';
let retrasoWhatsappKeys = new Map();
let retrasoMinutosKeys = new Map();
let autoTodayFilterActive = false;
let restoredFromCache = false;
let autoScrollFranjaPending = true;
const AUTO_FRANJA_PASADA_MIN = 55;
const AUTO_FRANJA_PROXIMA_MIN = 45;

const CACHE_KEY = 'orion_comunicaciones_cache_v9';
const CACHE_TTL_MS = 10 * 60 * 1000;
const $ = s => document.querySelector(s);

const DOCUMENTO_EVENT_SET = 'ORION_SET_DOCUMENTO_PACIENTE';
const DOCUMENTO_EVENT_CLEAR = 'ORION_CLEAR_DOCUMENTO_PACIENTE';
const DOCUMENTO_EVENT_NAV = 'ORION_NAVIGATE_TO_APP';
const LEGACY_EVENT_SET = 'ORION_SET_RECETA_PACIENTE';
const LEGACY_EVENT_CLEAR = 'ORION_CLEAR_RECETA_PACIENTE';
const DOCUMENTO_STORAGE_KEY = 'orion_documento_paciente_activo_v1';
const DOCUMENTO_STORAGE_TTL_MS = 2 * 60 * 60 * 1000;
const MOBILE_RECETA_URL = '../cmf/index.html';
const listEl = $('#list');

const presetsLinks = {
  consentimiento: `https://drive.google.com/drive/folders/1AiQBv5YuQeDGF6SzbBxMrau5NaTY901T?usp=drive_link`,
  indicaciones: `https://drive.google.com/drive/folders/1c5zx-x7Q0GnKDdnasBSBlPn86dR5C_9Z?usp=sharing`,
  infografia: ``,
  promocion: ``,
  derivacion_whatsapp: ``,
  ausente: ``
};

const ENCUESTAS = {
  salud_basica:
`🧠 *Encuesta Salud Básica (responder por favor):*
1) Dolor (0–10):
2) ¿Fiebre? (sí/no):
3) ¿Inflamación visible? (sí/no):
4) ¿Alergias medicamentosas? (cuáles):
5) Enfermedades sistémicas (Hipertensión/Diebetes/etc):
6) Medicación Habitual:`,

  anticoagulantes:
`🩸 *Encuesta Anticoagulantes:*
1) ¿Toma anticoagulantes/antiagregantes? (cuál):
2) Última dosis (fecha/hora):
3) INR reciente (si aplica):
4) ¿Control médico vigente? (sí/no):`,

  infeccion_urgencia:
`🚨 *Encuesta Infección/Urgencia:*
1) ¿Hinchazón facial? (sí/no):
2) ¿Trismus (dificultad para abrir)? (sí/no):
3) ¿Fiebre >38°C? (sí/no):
4) ¿Dificultad para tragar/respirar? (sí/no):`,

  analgesicos_alergias:
`💊 *Encuesta Analgésicos/Alergias:*
1) ¿Alergias a AINEs (ibuprofeno/ketorolaco) o paracetamol?:
2) ¿Úlcera gástrica/gastritis severa?:
3) ¿Asma sensible a AINEs?:
4) ¿Insuficiencia renal/hepática?:
5) ¿Embarazo/lactancia?:`,

  mini_ficha:
`🗂️ *Mini Ficha Clínica (por WhatsApp)*
1) Motivo principal / consulta:
2) Dolor (0–10) + localización:
3) ¿Fiebre? (sí/no):
4) Inflamación (intraoral / extraoral) + lado:
5) Trismus (dificultad para abrir) (sí/no):
6) ¿Dificultad para tragar/respirar? (sí/no):
7) Alergias medicamentosas (cuáles):
8) Enfermedades sistémicas (HTA/DM/etc):
9) Medicación habitual (incluye anticoagulantes/antiagregantes):
10) Última dosis anticoagulante/antiagregante (si aplica):
11) INR reciente (si aplica):
12) Embarazo / lactancia (sí/no):
13) Antecedentes quirúrgicos relevantes:
14) Adjuntar exámenes / fotos si tiene (opcional):`
};

function getEncuestaTxt_(){
  const on = document.getElementById('encuestaOn')?.checked;
  if(!on) return '';
  const t = (document.getElementById('encuestaTexto')?.value || '').trim();
  return t ? t : '';
}

function applyEncuestaToMessage_(baseMsg){
  const modo = document.getElementById('encuestaModo')?.value || 'append';
  const encuesta = getEncuestaTxt_();
  if(!encuesta) return baseMsg;

  if(modo === 'placeholder'){
    if(/\{\{ENCUESTA\}\}/.test(baseMsg)){
      return baseMsg.replace(/\{\{ENCUESTA\}\}/g, encuesta);
    }
  }
  return (baseMsg.trim() + "\n\n" + encuesta).trim();
}

function setupEncuestaUI_(){
  const tipoSel   = document.getElementById('encuestaTipo');
  const txt       = document.getElementById('encuestaTexto');
  const btnInsert = document.getElementById('encuestaInsertar');
  const chk       = document.getElementById('encuestaOn');

  if(!tipoSel || !txt || !btnInsert || !chk) return;

  const normKey = (v) => String(v||'')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'_')
    .replace(/[^a-z0-9_]/g,'');

  const pick = () => {
    const raw = tipoSel.value;
    const key = normKey(raw);
    if(ENCUESTAS[key]) return ENCUESTAS[key];
    const optText = tipoSel.options[tipoSel.selectedIndex]?.textContent || '';
    const key2 = normKey(optText);
    return ENCUESTAS[key2] || ENCUESTAS.salud_basica || '';
  };

  if(!(txt.value||'').trim()){
    txt.value = pick();
  }

  tipoSel.addEventListener('change', ()=> {
    txt.value = pick();
  });

  btnInsert.addEventListener('click', ()=> {
    const m = document.getElementById('mensajeTipo');
    if(!m) return;

    const modo = document.getElementById('encuestaModo')?.value || 'append';
    const encuesta = (txt.value || '').trim();

    let insertStr = '';
    if(modo === 'placeholder') insertStr = '{{ENCUESTA}}';
    else insertStr = encuesta;

    if(!insertStr) return alert('⚠️ Encuesta vacía.');

    const cur = (m.value || '').trim();
    if(insertStr === '{{ENCUESTA}}' && /\{\{ENCUESTA\}\}/.test(cur)){
      alert('ℹ️ Ya existe {{ENCUESTA}} en el Mensaje Base.');
      return;
    }

    m.value = (cur ? (cur + "\n\n" + insertStr) : insertStr).trim();
    m.dispatchEvent(new Event('input', {bubbles:true}));
    alert('✅ Encuesta insertada en Mensaje Base.');
  });
}

function ensureEncuestaPlaceholder_(){
  const m = document.getElementById('mensajeTipo');
  if(!m) return;
  const v = (m.value || '').trim();
  if(/\{\{ENCUESTA\}\}/.test(v)) return;
  m.value = (v ? (v + "\n\n{{ENCUESTA}}") : "{{ENCUESTA}}").trim();
}

