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

// TF Carnes es una empresa hermana (intercompany), no un cliente externo real —
// queda afuera del "Total a cobrar" y de los buckets de días, y se muestra aparte
// en su propia tarjeta. En la tabla de fechas sí aparecen sus comprobantes
// recientes (para seguir el cobro día a día), pero no los vencidos hace más de
// 15 días (deuda vieja intercompany que ya no es seguimiento diario).
const CLIENTE_TF_CARNES = "TF CARNES S.A.";
function esTFCarnes(cliente){ return cliente === CLIENTE_TF_CARNES; }
const TF_CARNES_DIAS_MIN_TABLA = -15;

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
// Vencido + Próx.7 + De7a15 + Más15 = deuda bruta total (antes de netear "a aplicar").
// TF Carnes y Difícil Cobro quedan afuera de estos buckets y del total: se muestran
// aparte en sus propias tarjetas.
function buildProyeccion(datos, key, porCliente){
  const porFecha = {};
  let dificilCobro = 0, tfCarnes = 0, vencido = 0, d7 = 0, d15 = 0, dMas = 0;
  datos.forEach(d => {
    const r = porCliente[d.cliente];
    const elegible = r && (r.debeA + r.debeB) > 0;
    if (!elegible) return; // sin deuda pendiente en NINGÚN archivo: no aporta ni resta
    if (esDificilCobro(d.cliente)) { if (d.importe > 0) dificilCobro += d.importe; return; }
    if (esTFCarnes(d.cliente)) {
      if (d.importe > 0) {
        tfCarnes += d.importe;
        const dias = calcularDias(d.vencimiento);
        // en la tabla no se muestra lo vencido hace más de 15 días (deuda intercompany vieja)
        if (dias >= TF_CARNES_DIAS_MIN_TABLA) agregarAFecha(porFecha, d.vencimiento, d.cliente, d.importe);
      }
      return;
    }
    if (d.importe > 0) {
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
    if ((r.debeA + r.debeB) <= 0 || esDificilCobro(cliente) || esTFCarnes(cliente)) return;
    const debe = key === 'A' ? r.debeA : r.debeB;
    const aplicar = key === 'A' ? r.aplicarA : r.aplicarB;
    totalCobrar += debe - aplicar;
  });
  const rows = Object.keys(porFecha).sort().map(f => ({
    fecha: f,
    importe: porFecha[f].total,
    dias: calcularDias(f),
    detalles: Object.entries(porFecha[f].porCliente)
      .map(([cliente, importe]) => ({ cliente, importe }))
      .sort((a, b) => b.importe - a.importe)
  }));
  // TF Carnes también tiene notas de crédito propias ("a aplicar") en este archivo.
  // La tarjeta muestra la deuda bruta; acá se calcula el neto para mostrarlo como
  // sub-dato (antes no se mostraba en ningún lado, aunque sí se usaba para el
  // "Total a cobrar" -- TF Carnes está afuera de ese total, no de este cálculo).
  const rTFC = porCliente[CLIENTE_TF_CARNES];
  const tfCarnesAplicar = rTFC ? (key === 'A' ? rTFC.aplicarA : rTFC.aplicarB) : 0;
  const tfCarnesNeto = tfCarnes - tfCarnesAplicar;
  return { totalCobrar, dificilCobro, tfCarnes, tfCarnesAplicar, tfCarnesNeto, vencido, d7, d15, dMas, rows };
}

// Despliega/oculta las filas de detalle (una por cliente) de una fila de fecha.
// Son filas hermanas en el mismo tbody, agrupadas por data-grupo (no se puede anidar
// <tr> dentro de otro <tr>).
function toggleDetalleFecha(fila, grupo){
  const filas = document.querySelectorAll(`tr.detalle-row[data-grupo="${grupo}"]`);
  if (!filas.length) return;
  const abierto = filas[0].style.display !== 'none';
  filas.forEach(f => { f.style.display = abierto ? 'none' : 'table-row'; });
  const chevron = fila.querySelector('.chevron');
  if (chevron) chevron.textContent = abierto ? '▶' : '▼';
}

function renderPanel(tag, datos, key, porCliente){
  const p = buildProyeccion(datos, key, porCliente);
  document.getElementById(`kpi${tag}-total`).textContent = fm(p.totalCobrar);
  document.getElementById(`kpi${tag}-vencido`).textContent = fm(p.vencido);
  document.getElementById(`kpi${tag}-dc`).textContent = fm(p.dificilCobro);
  document.getElementById(`kpi${tag}-tfc`).textContent = fm(p.tfCarnes);
  document.getElementById(`kpi${tag}-tfc-sub`).textContent =
    p.tfCarnesAplicar > 0 ? `− ${fm(p.tfCarnesAplicar)} a aplicar → neto ${fm(p.tfCarnesNeto)}` : '';
  document.getElementById(`kpi${tag}-d7`).textContent = fm(p.d7);
  document.getElementById(`kpi${tag}-d15`).textContent = fm(p.d15);
  document.getElementById(`kpi${tag}-d15plus`).textContent = fm(p.dMas);

  const tbody = document.getElementById(`tbody-${tag}`);
  if (!p.rows.length) { tbody.innerHTML = '<tr><td colspan="3" class="no-data">Sin cuentas a cobrar</td></tr>'; return; }
  tbody.innerHTML = p.rows.map((r, i) => {
    const rc = r.dias < 0 ? 'overdue-row' : r.dias <= 7 ? 'soon-row' : '';
    const diasLabel = r.dias < 0 ? `vencido ${Math.abs(r.dias)}d` : r.dias === 0 ? 'HOY' : `en ${r.dias}d`;
    const grupo = `${tag}-${i}`;
    const filaFecha = `<tr class="${rc}" style="cursor:pointer" onclick="toggleDetalleFecha(this,'${grupo}')">
      <td><span class="chevron">▶</span><span class="dlabel">${fmDate(r.fecha)}</span></td>
      <td class="dsub">${diasLabel}</td>
      <td>${fm(r.importe)}</td>
    </tr>`;
    const filasDetalle = r.detalles.map(x => `<tr class="detalle-row" data-grupo="${grupo}" style="display:none">
      <td colspan="2" class="detalle-cliente">${x.cliente}</td>
      <td class="detalle-importe">${fm(x.importe)}</td>
    </tr>`).join('');
    return filaFecha + filasDetalle;
  }).join('');
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

loadAllData();
