// ── CONFIG — Google Sheet propio de TF Carnes (pestañas "Archivo A"/"Archivo B") ──
const SHEET_ID = '1gcXrr3djFrdTTvMWn_9XkjFGm_TqQDVo5hMS0ZPqeAI';
const TAB_A = 'Archivo A';
const TAB_B = 'Archivo B';

// Cuentas que no son clientes reales de TF Carnes (proveedores, empleados, fletes,
// intercompany, etc.) — copiado 1 a 1 del sistema de Cobranzas de TF Carnes
// (EXCLUDED / isExcluded en el dashboard original).
const EXCLUDED = new Set([
  'AGENCIA DE RECAUDACION Y CONTROL ADUANERO',
  'BUENOS AIRES VALORES S.A.',
  'CAMPOS Y GANADOS S A REMATES COMISIONES Y CONSIGNACIONES',
  'CARLOS TOMAS CASTRO SUGASTI',
  'CASTRO TOMAS',
  'CONSUMIDOR FINAL',
  'DHF S.A',
  'DISTRIBUIDORA NAS S.R.L. - FLETES',
  'ENTIVOX SA',
  'FLETES',
  'FRANCISCO CIRO CASTRO SUGASTI',
  'FRANCISCO NAHUEL ADIMARO',
  'INDUSTRIA CUENTA 2',
  'JAVIER ALEJANDRO MEDINA',
  'MERCADO AGROGANADERO SA',
  'MUNICIPALIDAD DE SAN ISIDRO',
  'NICOLAS PULLEIRO',
  'OSDE ORGANIZACION DE SERVICIOS DIRECTOS EMPRESARIOS',
  'POTENCIAR SGR',
  'PROVINCIA LEASING SA',
  'SOLUCIONES EN ETIQUETAS S.A.',
  'SWISS MEDICAL S A',
  'TELEFONICA MOVILES ARGENTINA SOCIEDAD ANONIMA',
  'TF CARNES S.A.',
  'TRADE FOOD S.A',
  'TRANSCONT S R L',
  'YPF SOCIEDAD ANONIMA',
  '1CLARA S',
  'ADRIAN CALI',
  'AGUSTIN CAJAS',
  'AGUSTINA PULLEIRO',
  'ALEJANDRO MARTINEZ',
  'ALEJANDRO OSVALDO PULLEIRO',
  'ANA FRACICA',
  'CLAUDIO CASTAÑEDA (TF PLANTA)',
  'COMISIONES PEDIDOS YA',
  'DAMIAN MOTOQUERO',
  'DAMIAN SOBRINO DE PIRI',
  'DISTRIBUIDORA NAS - COMISIONES',
  'DISTRIBUIDORA NAS - FLETES',
  'ELIAN TF',
  'ENDERLIS ROMERO',
  'ENZO ALGAÑARAZ',
  'FEDE FRIGO',
  'FERNANDO MARICHALAR',
  'FIORELLA MOUTTET (TRADE FOOD)',
  'FLOR GARCIA',
  'FRANCISCO CANEPA',
  'FRANCISCO CAPOZZI',
  'FRANCISCO RAVETTI TRADE FOOD',
  'FRANCO ADIMARO (FRIGO)',
  'GASTON IRIGOYEN',
  'GESTIONES ADUANERAS Y SANITARIAS',
  'GINTER',
  'HERNAN GONZALEZ (TRADE FOOD)RRHH',
  'INDUSTRIA CARNICA DEL OESTE SRL',
  'JUAN PABLO DIAZ (MOTO)',
  'JUAN SOLIS',
  'KAREN SENASSA (FRIGO)',
  'KUKO',
  'LEA DE CARLO (PAJARITO)',
  'MARIA SOFIA AMESTOY',
  'MARIANO GIGENA (TRADE FOOD)',
  'MARTIN BILBAO',
  'MARTIN ROHNER (TRADE FOOD)',
  'MARTIN RUOCCO',
  'MILAM HUBER',
  'NACHO CAZENAVE TRADEFOOD',
  'NICOLAS BINAGUI',
  'PANCHO ADIMARO',
  'RAMIRO FREUE',
  'RAMIRO MIGUEL PARODI',
  'SANTIAGO CHUBURU',
  'SONIA YBARES TRADE FOOD',
  'TFC LA CARNICERIA',
  'VARIOS CANGALLO',
  'TARDITI DIEGO ALBERTO',
  // Nombres reales en archivos (distintos a los del listado)
  'GASTON EZEQUIEL IRIGOYEN',
  'HERNAN GONZALEZ',
  'MARTIN ROHNER',
  'IGNACIO CAZENAVE',
  'MARIANO GIGENA',
  'MARIANO IVAN GIGENA',
  'FIORELLA MOUTTET',
  'FRANCISCO JOSE CANEPA',
  'FRANCISCO JOSÉ CANEPA',
  'FRANCISCO RAVETTI ESCUDERO',
  'FRANCISCO MIGUEL RAVETTI ESCUDERO',
  'YBARES SONIA LORENA',
  'ENZO GUSTAVO ALGAÑARAZ NASTA',
  'UNO SUPERMERCADOS SA',
  'TITO PEREZ E HIJO S.A.',
  'DIEGO ALBERTO TARDITI',
  'TITO PEREZ',
  'SERVICIOS CARNICOS DEL SUR',
  'TARDITI',
  'DELTACAR S A',
  'CASNEM S.A.S.',
  'GUIDO JORGE MUÑOZ',
  'ROBOL LUIS MARIA',
  'LUCIANO RINALDI (LUCHO)',
  'SODECAR SA',
  'SOCIEDAD ANONIMA CARNES PAMPEANAS SA',
  'CARNES PAMPEANAS SA',
  'FRIGORIFICO ALBERDI SOCIEDAD ANONIMA',
  'GANADERA GRANADA S.A.',
  'ETCHEVEHERE RURAL S. R. L.',
  'HACIENDAS DEL NORTE',
  'GLOBALWING',
  'VILLAMAGNA HNOS SRL',
  'SENASA (FRIGO)',
  'LUCANI S.R.L.',
  'ORELLA S.R.L.',
  '5L SA',
  'COMERCIALIZADORA DE CARNES ROMERO VACA S.A.',
  'LA MERIDIONAL CIA ARG DE SEGUROS S A',
  'MARCELO RAUL LAURO',
  'NETLATIN S.R.L.',
  'P & Z S.A.',
  'SUMATIK SRL',
  'MARIANO BLUMENFELD',
  // Agregados a pedido: estos 6 no se toman en cuenta en ningún lado.
  'CARNES VIREYES S.A',
  'AUTOSERVICIO MAYORISTA DIARCO SA',
  'FRIMARC - INDUSTIRA E COMERCIO, SA',
  'OPEN ROUTE SAS',
  'SUDAMBEEF TRADING S.A.',
  'TIMBRO TRADING (AC COMERCIAL IMP E EXP LTDA)'
].map(s => s.trim().toUpperCase()));

const EXCLUIDOS_PARCIALES = ['TARDITI','DELTACAR','CASNEM','GUIDO JORGE MU','ROBOL','RINALDI',
  'SODECAR','PAMPEANAS','ALBERDI','GANADERA GRANADA','ETCHEVEHERE','HACIENDAS DEL NORTE',
  'GLOBALWING','VILLAMAGNA','SENASA','LUCANI','ORELLA','ROMERO VACA','LA MERIDIONAL',
  'MARCELO RAUL LAURO','NETLATIN','SUMATIK','BLUMENFELD',
  // Red de contención para los 6 agregados arriba: por si en el Sheet el nombre
  // viene con alguna variante de tipeo/espaciado distinta a la que me pasaste
  // (ej. "INDUSTIRA" vs "INDUSTRIA"), esto igual los agarra por el fragmento
  // más distintivo del nombre.
  'VIREYES','DIARCO','FRIMARC','OPEN ROUTE','SUDAMBEEF','TIMBRO TRADING','AC COMERCIAL'];

function esExcluido(name){
  if (!name || name === 'NaN') return true;
  const n = name.trim().toUpperCase();
  if (EXCLUDED.has(n)) return true;
  // Match parcial para apellidos que pueden venir con distintos nombres
  return EXCLUIDOS_PARCIALES.some(p => n.indexOf(p) > -1);
}

// Clientes "a resolver": quedan afuera del "Total a cobrar" normal y se muestran
// aparte (equivalente a Difícil Cobro en el dashboard de Trade Food) — copiado 1 a 1
// de RESOLVER_CLIENTS / isResolver del sistema de Cobranzas de TF Carnes.
const RESOLVER_CLIENTES = new Set([
  'HENAN HENG YE TRADE CO., LTD ADD',
  'FRESH EXPRESS KUWAIT',
  'GONZALO BADANO',
  'PATAGONIA VIANDAS Y CATERING S.R.L.',
  'SUPERMERCADOS MAYORISTAS YAGUAR SOCIEDAD ANONIMA',
  'SUPERMERCADOS MAYORISTAS YAGUAR SOCIEDA',
  'VITAFIL S.A.',
  'CARDINAL ALIMENTARIA',
  'CIA CARDINAL ALIMENTARIA S.A.',
  'CIA CARDINAL ALIMENTARIA SA',
  'CARDINAL ALIMENTARIA S.A.',
  'ROJAS VERA ALEX NAHUEL',
  'VENTA ZONA NORTE',
  'JOCKEY',
  'OFICINA TF'
].map(s => s.trim().toUpperCase()));

const RESOLVER_PARCIALES = ['HENAN HENG','FRESH EXPRESS','BADANO','PATAGONIA VIANDAS','YAGUAR',
  'VITAFIL','CARDINAL','ROJAS VERA','VENTA ZONA NORTE','JOCKEY','OFICINA TF'];

function esAResolver(cliente){
  if (!cliente) return false;
  const n = cliente.trim().toUpperCase();
  if (RESOLVER_CLIENTES.has(n)) return true;
  return RESOLVER_PARCIALES.some(p => n.indexOf(p) > -1);
}

// Misma lógica que esAResolver(), pero devuelve POR QUÉ en vez de solo sí/no —
// se usa nada más para el detalle del modal "A resolver (excluido)".
function razonAResolver(cliente){
  if (!cliente) return null;
  const n = cliente.trim().toUpperCase();
  if (RESOLVER_CLIENTES.has(n)) return 'Está en la lista "a resolver" (nombre exacto)';
  const frag = RESOLVER_PARCIALES.find(p => n.indexOf(p) > -1);
  if (frag) return `El nombre contiene "${frag}" (coincidencia parcial)`;
  return null;
}

// Recorre los mismos datos y con el mismo criterio de elegibilidad que usa
// buildProyeccion() para sumar aResolver (cliente con deuda pendiente en algún
// archivo + esAResolver() + importe positivo), pero por cliente y con motivo,
// para el modal. No cambia buildProyeccion ni el número que ya se mostraba.
function getAResolverDetalle(datos, porCliente){
  const porClienteMap = new Map();
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible || !esAResolver(d.cliente) || d.importe <= 0) return;
    if (!porClienteMap.has(d.cliente)) {
      porClienteMap.set(d.cliente, { cliente: d.cliente, razon: razonAResolver(d.cliente), importe: 0, filas: 0 });
    }
    const v = porClienteMap.get(d.cliente);
    v.importe += d.importe;
    v.filas += 1;
  });
  return [...porClienteMap.values()].sort((a, b) => b.importe - a.importe);
}

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
  })).filter(r => r.cliente && r.vencimiento && !esExcluido(r.cliente));
}

// Clasifica cada cliente combinando AMBOS archivos: un cliente entra a la proyección
// si tiene deuda pendiente en A o en B (sumadas), y recién ahí se le netea el
// "a aplicar" propio de CADA archivo por separado.
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
// Vencido + Próx.7 + De7a15 + Más15 = deuda bruta total (antes de netear "a aplicar").
// "A resolver" queda afuera de estos buckets y del total: se muestra aparte.
function buildProyeccion(datos, key, porCliente){
  const porFecha = {};
  let aResolver = 0, vencido = 0, d7 = 0, d15 = 0, dMas = 0;
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible) return; // sin deuda pendiente en NINGÚN archivo: no aporta ni resta
    if (esAResolver(d.cliente)) { if (d.importe > 0) aResolver += d.importe; return; }
    // Las notas de crédito (importe negativo) también restan de Vencido/A vencer,
    // en el bucket que le corresponda según SU PROPIA fecha de vencimiento — antes
    // solo se netaban contra el Total (aplicarA/aplicarB), acá quedaban afuera.
    if (d.importe !== 0) {
      const dias = calcularDias(d.vencimiento);
      if (dias <= 0) vencido += d.importe;
      else if (dias <= 7) d7 += d.importe;
      else if (dias <= 15) d15 += d.importe;
      else dMas += d.importe;
      agregarAFecha(porFecha, d.vencimiento, d.cliente, d.importe);
    }
  });
  let totalCobrar = 0;
  Object.entries(porCliente).forEach(([cliente, r]) => {
    if ((r.debeA + r.debeB) <= 0 || esAResolver(cliente)) return;
    const debe = key === 'A' ? r.debeA : r.debeB;
    const aplicar = key === 'A' ? r.aplicarA : r.aplicarB;
    totalCobrar += debe - aplicar;
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

  return { totalCobrar, aResolver, vencido, aVencer: d7 + d15 + dMas, d7, d15, dMas, rows };
}

function fmtExcl(n){ const s = fm(Math.abs(n)); return n < 0 ? `-${s}` : s; }
function fmtDiasUno(d){ return d < 0 ? `vencido hace ${Math.abs(d)}d` : d === 0 ? 'vence hoy' : `vence en ${d}d`; }
function fmtDiasRango(min, max){ return min === max ? fmtDiasUno(min) : `${fmtDiasUno(min)} … ${fmtDiasUno(max)}`; }

// Detalle de "Total a cobrar": mismo criterio que el loop de totalCobrar en
// buildProyeccion() (cliente elegible, no "a resolver", debe−aplicar de ESTE
// archivo), pero por cliente en vez de un solo número.
function getTotalCobrarDetalle(datos, key, porCliente){
  const filasPorCliente = new Map();
  datos.forEach(d => filasPorCliente.set(d.cliente, (filasPorCliente.get(d.cliente) || 0) + 1));
  const list = [];
  Object.entries(porCliente).forEach(([cliente, r]) => {
    if ((r.debeA + r.debeB) <= 0 || esAResolver(cliente)) return;
    const debe = key === 'A' ? r.debeA : r.debeB;
    const aplicar = key === 'A' ? r.aplicarA : r.aplicarB;
    if (debe === 0 && aplicar === 0) return; // elegible por el otro archivo, acá no tiene filas
    list.push({
      cliente,
      razon: aplicar > 0 ? `Debe ${fmtExcl(debe)} − aplica ${fmtExcl(aplicar)}` : `Debe ${fmtExcl(debe)}`,
      filas: filasPorCliente.get(cliente) || 0,
      importe: debe - aplicar,
    });
  });
  return list.sort((a, b) => b.importe - a.importe);
}

// Detalle de un bucket de días (Vencido / Próx.7 / De7a15 / Más15 / A vencer
// combinado): mismo criterio de elegibilidad + esAResolver + importe>0 que
// usa buildProyeccion() para sumar cada bucket, agrupado por cliente.
function getBucketDetalle(datos, porCliente, filtroDias){
  const map = new Map();
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    // Incluye notas de crédito (importe < 0): restan del bucket que les toca
    // según su propia fecha, igual que en buildProyeccion().
    if (!elegible || esAResolver(d.cliente) || d.importe === 0) return;
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
const sortState = { A: { col: 'fecha', dir: 1 }, B: { col: 'fecha', dir: 1 } };
const ultimaProyeccion = { A: null, B: null };
const ultimoAResolverDetalle = { A: [], B: [] };
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
function verAResolver(tag){
  abrirModalDetalle(`A resolver (excluido) · Archivo ${tag}`, ultimoAResolverDetalle[tag] || [], 'No hay clientes "a resolver" en este archivo', 'Por qué está "a resolver"');
}

// Config de cada KPI clickeable: título del modal, texto de la 2da columna,
// y mensaje cuando no hay nada que mostrar.
const KPI_INFO = {
  total:   { titulo: 'Total a cobrar',     col2: 'Cómo se compone',      vacio: 'No hay cuentas a cobrar en este archivo' },
  vencido: { titulo: 'Vencido',            col2: 'Vencimiento',          vacio: 'No hay comprobantes vencidos' },
  avencer: { titulo: 'A vencer',           col2: 'Vencimiento',          vacio: 'No hay comprobantes a vencer' },
  d7:      { titulo: 'Próx. 7 días',       col2: 'Vencimiento',          vacio: 'No hay comprobantes en los próximos 7 días' },
  d15:     { titulo: 'De 7 a 15 días',     col2: 'Vencimiento',          vacio: 'No hay comprobantes entre 7 y 15 días' },
  d15plus: { titulo: 'Más de 15 días',     col2: 'Vencimiento',          vacio: 'No hay comprobantes a más de 15 días' },
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
  ultimoAResolverDetalle[tag] = getAResolverDetalle(datos, porCliente);
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
  document.getElementById(`kpi${tag}-dc`).textContent = fm(p.aResolver);
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
    const [gA, gB] = await Promise.all([loadSheetJSONP(TAB_A), loadSheetJSONP(TAB_B)]);
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
  const saved = parseInt(localStorage.getItem('tfcob_zoom_tfc'), 10);
  if (saved >= ZOOM_MIN && saved <= ZOOM_MAX) zoomLevel = saved;
} catch(e) {}

function aplicarZoom(){
  const page = document.querySelector('.page');
  if (page) page.style.zoom = (zoomLevel / 100);
  const el = document.getElementById('zoom-level');
  if (el) el.textContent = zoomLevel + '%';
  try { localStorage.setItem('tfcob_zoom_tfc', zoomLevel); } catch(e) {}
}
function zoomIn(){ zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); aplicarZoom(); }
function zoomOut(){ zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); aplicarZoom(); }

aplicarZoom();
loadAllData();
