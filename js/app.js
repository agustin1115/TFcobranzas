// ── CONFIG — mismo Google Sheet y misma lógica de lectura que Cobranzas ────
const SHEET_ID = '1ws-DoN_nPtlqV8jeTjpl2uaosXHczBJYxia_KI-HRKI';

// Cuentas que no son clientes reales (proveedores, seguros, empleados, etc.) —
// se excluyen para que "Cuenta a cobrar" refleje solo deuda real de clientes.
const CLIENTES_EXCLUIDOS = new Set([
  "BUENOS AIRES VALORES S.A.","CASTRO TOMAS","FRANCISCO MIGUEL RAVETTI ESCUDERO",
  "GASTON EZEQUIEL IRIGOYEN","HAUSWAGEN - PILAR S A","HERNAN GONZALEZ",
  "JERONIMO DELGADO","MARIANO IVAN GIGENA","MULLER RENE SEBASTIAN",
  "NICOLAS ALEJANDRO VILLALBA","OSDE ORGANIZACION DE SERVICIOS DIRECTOS EMPRESARIOS",
  "PAOLO COLANTONIO","POTENCIAR SGR","PROVINCIA LEASING SA",
  "SANCOR COOPERATIVA DE SEGUROS LIMITADA","TRADE FOOD S.A","YPF SOCIEDAD ANONIMA",
  "ZURICH ASEGURADORA ARGENTINA S.A","CLARA MARIA SUGASTI","CONSTANZA CASTRO CRANWELL",
  "CONSTANZA MARIA CASTRO CRANWELL","FRANCISCO JOSÉ CANEPA","FRANCISCO RAVETTI ESCUDERO",
  "GIULIANO ALFREDO RAPETTI DOMINGUEZ","IGNACIO CAZENAVE","JUAN BAUTISTA ARRICAU",
  "JUAN PEDRO IRIGARAY","MARIANO GIGENA","Martin Rohner","Nicolas binaghi",
  "RAINIER JAVIER DIAZ","YBARES SONIA LORENA","VARIOS CANGALLO","FIORELLA MOUTTET",
  "ENZO GUSTAVO ALGAÑARAZ NASTA","FLETES","NERA S.A.U.","CARLOS RAMON CASTRO ACHAVAL",
  "HECTOR SALVADOR CAÑETE","CARLOS RAMON CASTRO ACHAVAL - RETIROS",
  "FRANCISCO CIRO CASTRO SUGASTI","Francisco Ciro Castro Sugasti - Retiros",
  "TOMAS CARLOS CASTRO - RETIROS","TELEFONICA MOVILES ARGENTINA SOCIEDAD ANONIMA",
  "MERITI SRL","SINDICATO EMPLEADOS DE COMERCIO CAPITAL FEDERAL","CAFFARO TOMAS JOSE",
  "MENDEZ MATIAS","LEONARDO JESUS THEILER","ARAMBURU RAMIRO","FRANCISCO MANUEL DELGADO",
  "JUAN PABLO DIAZ (MOTO)"
]);

// Clientes de difícil cobro: quedan afuera del "Total a cobrar" normal (igual que en el
// Resumen Ejecutivo de Cobranzas) y se muestran aparte para no inflar la proyección.
const CLIENTES_DIFICIL_COBRO = new Set([
  "MONICA EVANGELINA CAMPORA","MOSAINER CARLOS ARTURO","CARNES VIREYES S.A",
  "HECTOR EDUARDO DE LA FUENTE","CIA CARDINAL ALIMENTARIA S.A.","LEONARDO DANIEL ORZAN",
  "FRIGORIFICO UNION SA.","ECOCARNES S.A.","MATADERO Y FRIGORÍFICO FEDERAL S.A.",
  "SEMOTRA EMPRENDIMIENTOS SRL",
  "LOS CHARANGUITOS SOCIEDAD SIMPLE DE LEANDRO FABIAN CIAN Y DANIELA TERESA CIAN S. CAP I SECC IV",
  "CARNES EL DIAMANTE S.R.L."
]);
function esDificilCobro(cliente){ return CLIENTES_DIFICIL_COBRO.has(cliente); }
// Acá la lista es de coincidencia exacta nada más (a diferencia de TF Carnes,
// que también tiene coincidencia parcial) — por eso el motivo es siempre el
// mismo texto, no hace falta distinguir casos.
function razonDificilCobro(cliente){ return esDificilCobro(cliente) ? 'Está en la lista de difícil cobro (nombre exacto)' : null; }

// ── JSONP LOADER — igual que en Cobranzas, funciona desde file:// sin CORS ─
function loadSheetJSONP(sheetName) {
  return new Promise((resolve, reject) => {
    const cb = '_gviz_' + sheetName.replace(/\W/g,'_') + '_' + Date.now();
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; cleanup(); reject(new Error(`Timeout cargando "${sheetName}"`)); }
    }, 20000);
    function cleanup() { clearTimeout(timeout); delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); }
    window[cb] = function(data) {
      if (done) return; done = true; cleanup();
      if (!data || data.status === 'error') { reject(new Error(`Error en pestaña "${sheetName}": ` + (data?.errors?.[0]?.detailed_message || 'desconocido'))); return; }
      resolve(data);
    };
    const s = document.createElement('script');
    s.onerror = () => { if (!done) { done = true; cleanup(); reject(new Error(`No se pudo cargar "${sheetName}". Verificá que el Sheet sea público.`)); } };
    s.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${cb}&sheet=${encodeURIComponent(sheetName)}&headers=1`;
    document.head.appendChild(s);
  });
}

function gvizToRows(data) {
  const rawCols = (data.table.cols || []).map(c => (c.label || c.id || '').trim());
  const allEmpty = rawCols.every(c => !c);
  const rawRows  = data.table.rows || [];
  let cols, dataRows;
  if (allEmpty && rawRows.length > 0) {
    cols     = (rawRows[0].c || []).map(cell => (cell && cell.v ? String(cell.v).trim() : ''));
    dataRows = rawRows.slice(1);
  } else {
    cols     = rawCols;
    dataRows = rawRows;
  }
  return dataRows.map(row => {
    const obj = {};
    (row.c || []).forEach((cell, i) => {
      const key = cols[i]; if (!key) return;
      obj[key]         = (cell && cell.v !== null && cell.v !== undefined) ? cell.v : '';
      obj[key + '__f'] = (cell && cell.f) ? cell.f : '';
    });
    return obj;
  });
}

function gvizDate(val, fmt) {
  if (!val && !fmt) return '';
  const sv = String(val);
  const dm = sv.match(/^Date\((\d+),(\d+),(\d+)\)/);
  if (dm) return `${dm[1]}-${String(+dm[2]+1).padStart(2,'0')}-${String(+dm[3]).padStart(2,'0')}`;
  const src = fmt || sv;
  const fm2 = src.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fm2) return `${fm2[3]}-${fm2[2].padStart(2,'0')}-${fm2[1].padStart(2,'0')}`;
  return '';
}

function parseImporte(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/,/g, '')) || 0;
}

function calcularDias(iso){
  if(!iso) return 999;
  const v=new Date(iso+'T00:00:00'), h=new Date(); h.setHours(0,0,0,0);
  return Math.round((v-h)/86400000);
}

// ── FORMAT ───────────────────────────────────────────────────────────────
const fm = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(n));
function fmDate(iso){ if(!iso) return ''; const p=iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function showLoading(on){ document.getElementById('loading-bar').style.display = on?'block':'none'; }
function showMessage(html,type){ const d=document.getElementById('upload-messages'); const m=document.createElement('div'); m.className=`message ${type}`; m.innerHTML=html; d.appendChild(m); setTimeout(()=>m.remove(),12000); }
function clearMessages(){ document.getElementById('upload-messages').innerHTML=''; }

// ── DATA ─────────────────────────────────────────────────────────────────
function processSheet(rows){
  return rows.map(row => ({
    cliente:     String(row['Razón social'] || '').trim(),
    vencimiento: gvizDate(row['Fecha Vencimiento'], row['Fecha Vencimiento__f']),
    importe:     parseImporte(row['Importe'] !== '' ? row['Importe'] : row['Importe__f'])
  })).filter(r => r.cliente && r.vencimiento && !CLIENTES_EXCLUIDOS.has(r.cliente));
}

// Clasifica cada cliente combinando AMBOS archivos (igual que el Resumen Ejecutivo de
// Cobranzas): un cliente entra a la proyección si tiene deuda pendiente en A o en B
// (sumadas), y recién ahí se le netea el "a aplicar" propio de CADA archivo por separado.
// Si se calculara el "a aplicar" archivo por archivo de forma aislada, una nota de
// crédito de un cliente sin deuda en ESE archivo restaría del total igual — por eso
// hay que mirar la deuda combinada para decidir si esa nota de crédito corresponde.
function clasificarClientes(datosA, datosB){
  const porCliente = {};
  function acc(datos, key){
    datos.forEach(d => {
      if (!porCliente[d.cliente]) porCliente[d.cliente] = { debeA:0, aplicarA:0, debeB:0, aplicarB:0 };
      const r = porCliente[d.cliente];
      if (d.importe > 0) { if (key==='A') r.debeA += d.importe; else r.debeB += d.importe; }
      else if (d.importe < 0) { if (key==='A') r.aplicarA += Math.abs(d.importe); else r.aplicarB += Math.abs(d.importe); }
    });
  }
  acc(datosA, 'A'); acc(datosB, 'B');
  return porCliente;
}

// Arma la proyección estilo cash flow para UN archivo: agrupa por fecha de vencimiento
// (solo importes positivos = deuda pendiente) y calcula los buckets de días. Excluye
// difícil cobro del total normal y neteA "a aplicar" solo para clientes con deuda real.
// Acumula un importe en el bucket de una fecha, guardando también el desglose por
// cliente para poder mostrarlo al desplegar la fila en la tabla.
function agregarAFecha(porFecha, fecha, cliente, importe){
  if (!porFecha[fecha]) porFecha[fecha] = { total: 0, porCliente: {} };
  porFecha[fecha].total += importe;
  porFecha[fecha].porCliente[cliente] = (porFecha[fecha].porCliente[cliente] || 0) + importe;
}

// Buckets de días MUTUAMENTE EXCLUYENTES (cada comprobante cae en uno solo):
//   Vencido        → dias <= 0  (incluye lo que vence hoy)
//   Próx. 7 días   → 1 a 7 días
//   De 7 a 15 días → 8 a 15 días
//   Más de 15 días → 16+ días
// Vencido + Próx.7 + De7a15 + Más15 = Total a cobrar (deuda bruta, SIN netear
// "a aplicar" — a pedido tuyo el Total ya no resta las notas de crédito).
// Difícil Cobro queda afuera de estos buckets y del total: se muestra aparte en su
// propia tarjeta. TF Carnes se trata como un cliente normal (sin exclusión).
function buildProyeccion(datos, key, porCliente){
  const porFecha = {};
  let dificilCobro = 0, vencido = 0, d7 = 0, d15 = 0, dMas = 0;
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible) return; // sin deuda pendiente en NINGÚN archivo: no aporta ni resta
    if (esDificilCobro(d.cliente)) { if (d.importe > 0) dificilCobro += d.importe; return; }
    if (d.importe > 0) {
      const dias = calcularDias(d.vencimiento);
      if (dias <= 0) vencido += d.importe;
      else if (dias <= 7) d7 += d.importe;
      else if (dias <= 15) d15 += d.importe;
      else dMas += d.importe;
      agregarAFecha(porFecha, d.vencimiento, d.cliente, d.importe);
    }
  });
  // Total a cobrar = solo "debe" (Vencido + A vencer), sin restar "a aplicar"
  // (notas de crédito) — a pedido tuyo. aplicarA/aplicarB se siguen guardando
  // en clasificarClientes() porque getTotalCobrarDetalle() todavía las
  // muestra como dato informativo en el modal de detalle, pero ya no afectan
  // este número.
  let totalCobrar = 0;
  Object.entries(porCliente).forEach(([cliente, r]) => {
    if ((r.debeA + r.debeB) <= 0 || esDificilCobro(cliente)) return;
    const debe = key === 'A' ? r.debeA : r.debeB;
    totalCobrar += debe;
  });

  // Lo vencido hace más de 30 días se acumula en UNA sola fila (sin desglose por
  // fecha ni por empresa, solo el monto total) en vez de mostrar cada fecha vieja
  // por separado — son comprobantes muy viejos, no aportan al seguimiento diario.
  const VENCIDO_AGRUPAR_DIAS = -30;
  const rows = [];
  let agrupado = null; // { total, fechaMin, diasMin }
  Object.keys(porFecha).sort().forEach(f => {
    const dias = calcularDias(f);
    if (dias < VENCIDO_AGRUPAR_DIAS) {
      if (!agrupado) agrupado = { total: 0, fechaMin: f, diasMin: dias };
      agrupado.total += porFecha[f].total;
      if (f < agrupado.fechaMin) agrupado.fechaMin = f;
      if (dias < agrupado.diasMin) agrupado.diasMin = dias;
      return;
    }
    rows.push({
      fecha: f,
      importe: porFecha[f].total,
      dias,
      detalles: Object.entries(porFecha[f].porCliente)
        .map(([cliente, importe]) => ({ cliente, importe }))
        .sort((a, b) => b.importe - a.importe)
    });
  });
  if (agrupado) {
    rows.push({
      fecha: agrupado.fechaMin,
      importe: agrupado.total,
      dias: agrupado.diasMin,
      agrupado: true,
      detalles: []
    });
  }

  return { totalCobrar, dificilCobro, vencido, aVencer: d7 + d15 + dMas, d7, d15, dMas, rows };
}

function fmtExcl(n){ const s = fm(Math.abs(n)); return n < 0 ? `-${s}` : s; }
function fmtDiasUno(d){ return d < 0 ? `vencido hace ${Math.abs(d)}d` : d === 0 ? 'vence hoy' : `vence en ${d}d`; }
function fmtDiasRango(min, max){ return min === max ? fmtDiasUno(min) : `${fmtDiasUno(min)} … ${fmtDiasUno(max)}`; }

// Detalle de "Difícil cobro (excluido)": mismo criterio que buildProyeccion()
// (cliente elegible + esDificilCobro + importe positivo), agrupado por cliente.
function getDificilCobroDetalle(datos, porCliente){
  const map = new Map();
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible || !esDificilCobro(d.cliente) || d.importe <= 0) return;
    if (!map.has(d.cliente)) map.set(d.cliente, { cliente: d.cliente, razon: razonDificilCobro(d.cliente), importe: 0, filas: 0 });
    const v = map.get(d.cliente);
    v.importe += d.importe;
    v.filas += 1;
  });
  return [...map.values()].sort((a, b) => b.importe - a.importe);
}

// Detalle de "Total a cobrar": mismo criterio que el loop de totalCobrar en
// buildProyeccion() (cliente elegible, sin difícil cobro, debe−aplicar de ESTE
// archivo), pero por cliente en vez de un solo número.
function getTotalCobrarDetalle(datos, key, porCliente){
  const filasPorCliente = new Map();
  datos.forEach(d => filasPorCliente.set(d.cliente, (filasPorCliente.get(d.cliente) || 0) + 1));
  const list = [];
  Object.entries(porCliente).forEach(([cliente, r]) => {
    if ((r.debeA + r.debeB) <= 0 || esDificilCobro(cliente)) return;
    const debe = key === 'A' ? r.debeA : r.debeB;
    if (debe === 0) return; // elegible por el otro archivo, acá no tiene filas
    const aplicar = key === 'A' ? r.aplicarA : r.aplicarB;
    list.push({
      cliente,
      // "Total a cobrar" ya no resta "a aplicar" — se muestra solo como dato
      // informativo (no afecta el importe de la fila, que es "debe" nomás).
      razon: aplicar > 0 ? `Tiene ${fmtExcl(aplicar)} aplicado (nota de crédito), ya no se resta` : '',
      filas: filasPorCliente.get(cliente) || 0,
      importe: debe,
    });
  });
  return list.sort((a, b) => b.importe - a.importe);
}

// Detalle de un bucket de días (Vencido / Próx.7 / De7a15 / Más15 / A vencer
// combinado): mismo criterio de elegibilidad + esDificilCobro + importe>0 que
// usa buildProyeccion() para sumar cada bucket, agrupado por cliente.
function getBucketDetalle(datos, porCliente, filtroDias){
  const map = new Map();
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible || esDificilCobro(d.cliente) || d.importe <= 0) return;
    const dias = calcularDias(d.vencimiento);
    if (!filtroDias(dias)) return;
    if (!map.has(d.cliente)) map.set(d.cliente, { cliente: d.cliente, importe: 0, filas: 0, diasMin: dias, diasMax: dias });
    const v = map.get(d.cliente);
    v.importe += d.importe;
    v.filas += 1;
    if (dias < v.diasMin) v.diasMin = dias;
    if (dias > v.diasMax) v.diasMax = dias;
  });
  return [...map.values()]
    .map(v => ({ cliente: v.cliente, razon: fmtDiasRango(v.diasMin, v.diasMax), filas: v.filas, importe: v.importe }))
    .sort((a, b) => b.importe - a.importe);
}

// Estado de orden de la tabla y última proyección calculada, por panel (A/B).
// Se guarda la proyección para poder reordenar sin tener que recalcular todo.
const sortState = { A: { col: 'fecha', dir: 1 }, B: { col: 'fecha', dir: 1 } };
const ultimaProyeccion = { A: null, B: null };
const ultimoDificilCobroDetalle = { A: [], B: [] };
const detallesKpi = {
  A: { total: [], vencido: [], avencer: [], d7: [], d15: [], d15plus: [] },
  B: { total: [], vencido: [], avencer: [], d7: [], d15: [], d15plus: [] },
};

function abrirModalDetalle(titulo, lista, vacioMsg, col2Label){
  const totalImporte = lista.reduce((s, r) => s + r.importe, 0);
  const totalFilas = lista.reduce((s, r) => s + r.filas, 0);
  document.getElementById('excl-title').textContent = titulo;
  document.getElementById('excl-sub').textContent =
    `${lista.length} clientes · ${totalFilas} filas del Sheet · ${fmtExcl(totalImporte)} en total`;
  const elCol2 = document.getElementById('excl-col2');
  if (elCol2) elCol2.textContent = col2Label || 'Detalle';
  const tbody = document.getElementById('excl-tbody');
  tbody.innerHTML = lista.length
    ? lista.map(r => `<tr>
        <td>${r.cliente}</td>
        <td class="excl-razon">${r.razon || '—'}</td>
        <td class="r">${r.filas}</td>
        <td class="r">${fmtExcl(r.importe)}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="no-data">${vacioMsg}</td></tr>`;
  document.getElementById('excl-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function verDificilCobro(tag){
  abrirModalDetalle(`Difícil cobro (excluido) · Archivo ${tag}`, ultimoDificilCobroDetalle[tag] || [], 'No hay clientes de difícil cobro en este archivo', 'Por qué es difícil cobro');
}
const KPI_INFO = {
  total:   { titulo: 'Total a cobrar',     col2: 'Cómo se compone', vacio: 'No hay cuentas a cobrar en este archivo' },
  vencido: { titulo: 'Vencido',            col2: 'Vencimiento',     vacio: 'No hay comprobantes vencidos' },
  avencer: { titulo: 'A vencer',           col2: 'Vencimiento',     vacio: 'No hay comprobantes a vencer' },
  d7:      { titulo: 'Próx. 7 días',       col2: 'Vencimiento',     vacio: 'No hay comprobantes en los próximos 7 días' },
  d15:     { titulo: 'De 7 a 15 días',     col2: 'Vencimiento',     vacio: 'No hay comprobantes entre 7 y 15 días' },
  d15plus: { titulo: 'Más de 15 días',     col2: 'Vencimiento',     vacio: 'No hay comprobantes a más de 15 días' },
};
function verKpi(tag, tipo){
  const info = KPI_INFO[tipo];
  const lista = (detallesKpi[tag] && detallesKpi[tag][tipo]) || [];
  abrirModalDetalle(`${info.titulo} · Archivo ${tag}`, lista, info.vacio, info.col2);
}
function cerrarExcluidos(){
  document.getElementById('excl-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function ordenarTabla(tag, columna){
  const st = sortState[tag];
  if (st.col === columna) st.dir *= -1; else { st.col = columna; st.dir = 1; }
  renderTabla(tag);
}

function renderTabla(tag){
  const p = ultimaProyeccion[tag];
  if (!p) return;
  const { col, dir } = sortState[tag];
  const valor = r => col === 'fecha' ? r.fecha : col === 'dias' ? r.dias : r.importe;
  const rows = [...p.rows].sort((a, b) => {
    const va = valor(a), vb = valor(b);
    return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
  });

  ['fecha', 'dias', 'importe'].forEach(c => {
    const th = document.getElementById(`th-${tag}-${c}`);
    if (!th) return;
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (c === col) th.classList.add(dir === 1 ? 'sorted-asc' : 'sorted-desc');
  });

  const tbody = document.getElementById(`tbody-${tag}`);
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="no-data">Sin cuentas a cobrar</td></tr>'; return; }
  tbody.innerHTML = rows.map(r => {
    if (r.agrupado) {
      return `<tr class="overdue-row">
        <td><span class="dlabel">Vencido hace más de 30 días</span></td>
        <td class="dsub">acumulado</td>
        <td>${fm(r.importe)}</td>
        <td class="empresas-cell">—</td>
      </tr>`;
    }
    const rc = r.dias < 0 ? 'overdue-row' : r.dias <= 7 ? 'soon-row' : '';
    const diasLabel = r.dias < 0 ? `vencido ${Math.abs(r.dias)}d` : r.dias === 0 ? 'HOY' : `en ${r.dias}d`;
    const empresas = r.detalles.map(x => `${x.cliente} (${fm(x.importe)})`).join(', ');
    return `<tr class="${rc}">
      <td><span class="dlabel">${fmDate(r.fecha)}</span></td>
      <td class="dsub">${diasLabel}</td>
      <td>${fm(r.importe)}</td>
      <td class="empresas-cell">${empresas}</td>
    </tr>`;
  }).join('');
}

function renderPanel(tag, datos, key, porCliente){
  const p = buildProyeccion(datos, key, porCliente);
  ultimaProyeccion[tag] = p;
  ultimoDificilCobroDetalle[tag] = getDificilCobroDetalle(datos, porCliente);
  detallesKpi[tag] = {
    total:   getTotalCobrarDetalle(datos, key, porCliente),
    vencido: getBucketDetalle(datos, porCliente, dias => dias <= 0),
    avencer: getBucketDetalle(datos, porCliente, dias => dias >= 1),
    d7:      getBucketDetalle(datos, porCliente, dias => dias >= 1 && dias <= 7),
    d15:     getBucketDetalle(datos, porCliente, dias => dias >= 8 && dias <= 15),
    d15plus: getBucketDetalle(datos, porCliente, dias => dias >= 16),
  };
  document.getElementById(`kpi${tag}-total`).textContent = fm(p.totalCobrar);
  document.getElementById(`kpi${tag}-vencido`).textContent = fm(p.vencido);
  document.getElementById(`kpi${tag}-dc`).textContent = fm(p.dificilCobro);
  document.getElementById(`kpi${tag}-avencer`).textContent = fm(p.aVencer);
  document.getElementById(`kpi${tag}-d7`).textContent = fm(p.d7);
  document.getElementById(`kpi${tag}-d15`).textContent = fm(p.d15);
  document.getElementById(`kpi${tag}-d15plus`).textContent = fm(p.dMas);

  renderTabla(tag);
}

// ── LOAD ─────────────────────────────────────────────────────────────────
async function loadAllData(){
  showLoading(true);
  const btn = document.getElementById('btn-refresh');
  if (btn) btn.disabled = true;
  clearMessages();
  try {
    const [gA, gB] = await Promise.all([loadSheetJSONP('A'), loadSheetJSONP('B')]);
    const datosA = processSheet(gvizToRows(gA));
    const datosB = processSheet(gvizToRows(gB));
    const porCliente = clasificarClientes(datosA, datosB);
    document.getElementById('fecha-carga').textContent =
      'Actualizado: ' + new Date().toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    renderPanel('A', datosA, 'A', porCliente);
    renderPanel('B', datosB, 'B', porCliente);
  } catch(err) {
    showMessage(
      '⚠️ ' + err.message +
      '<br><small>Verificá que el Google Sheet esté configurado como <strong>"Cualquiera con el vínculo puede ver"</strong>.</small>',
      'error'
    );
    console.error(err);
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}

// ── ZOOM ─────────────────────────────────────────────────────────────────
const ZOOM_MIN = 70, ZOOM_MAX = 200, ZOOM_STEP = 10;
let zoomLevel = 100;
try {
  const saved = parseInt(localStorage.getItem('tfcob_zoom'), 10);
  if (saved >= ZOOM_MIN && saved <= ZOOM_MAX) zoomLevel = saved;
} catch(e) {}

function aplicarZoom(){
  const page = document.querySelector('.page');
  if (page) page.style.zoom = (zoomLevel / 100);
  const el = document.getElementById('zoom-level');
  if (el) el.textContent = zoomLevel + '%';
  try { localStorage.setItem('tfcob_zoom', zoomLevel); } catch(e) {}
}
function zoomIn(){ zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); aplicarZoom(); }
function zoomOut(){ zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); aplicarZoom(); }

aplicarZoom();
loadAllData();
