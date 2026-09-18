# Cuentas a Cobrar Proyectadas

App estática (sin build, sin dependencias) que muestra una proyección estilo cash flow
de las cuentas a cobrar, leyendo en vivo desde Google Sheets. El repo alberga dos
dashboards independientes — uno por empresa, mismo formato visual — con un selector
arriba de todo para pasar de uno al otro.

## Estructura

- `index.html` — dashboard de **Trade Food** · `css/style.css` · `js/app.js`
- `tfcarnes.html` — dashboard de **TF Carnes** · `css/tfcarnes.css` · `js/tfcarnes.js`
- Cada dashboard es independiente: su propio Google Sheet, su propia lógica de
  clasificación de clientes, su propio CSS. Comparten exactamente el mismo formato
  (grilla de KPIs + tabla de proyección por Archivo A/B) y el mismo componente de
  selector de empresa (`.company-switch` / `.cs-btn`, dentro del `.header` de cada
  página) — son simples links cruzados (`href="tfcarnes.html"` / `href="index.html"`),
  no hay estado ni datos compartidos entre ambos.
- En Trade Food el botón activo usa el bordo de la marca (`var(--tf-primary)`); en
  TF Carnes se mantiene el verde oliva (`#4a5d3a`).

## Datos

Cada dashboard lee en vivo, vía JSONP (`gviz/tq`), las pestañas de su propio Google
Sheet (`SHEET_ID` propio de cada empresa). El Sheet debe estar compartido como
**"Cualquiera con el vínculo puede ver"** para que funcione.

- **Trade Food** (`js/app.js`): pestañas `A`/`B`. Excluye `CLIENTES_EXCLUIDOS`
  (proveedores, seguros, empleados, etc.). `CLIENTES_DIFICIL_COBRO` queda afuera del
  "Total a cobrar" normal y se muestra aparte. TF Carnes se trata como un cliente
  normal (no se excluye).
- **TF Carnes** (`js/tfcarnes.js`): pestañas `Archivo A`/`Archivo B`. Excluye
  `EXCLUDED` (copiado 1 a 1 del sistema de Cobranzas de TF Carnes, incluye matches
  parciales por apellido). `RESOLVER_CLIENTES` ("Clientes a Resolver") queda afuera
  del "Total a cobrar" normal y se muestra aparte — es el equivalente de "Difícil
  Cobro" en Trade Food. Verificado contra el Resumen Ejecutivo real del sistema de
  Cobranzas de TF Carnes (Neto A/B y Clientes a Resolver A/B coinciden exacto).
- En ambos: un cliente entra a la proyección de un archivo (A o B) si tiene deuda
  pendiente en **cualquiera de los dos archivos** (combinados); recién ahí se le
  netea el "a aplicar" (notas de crédito) propio de cada archivo.

## Vista

- **Archivo A** (arriba) y **Archivo B** (abajo), cada uno con su propia grilla de KPIs
  (Total a cobrar / Vencido / [Difícil cobro | A resolver] / Próx. 7 días / De 7 a 15
  días / Más de 15 días) y su tabla de proyección (Fecha | Días | Cuenta a cobrar |
  Empresas), con el mismo formato visual que la tabla de cash flow de cashflow-tesoreria.
- Las tres primeras columnas de la tabla se pueden ordenar haciendo clic en el
  encabezado. La columna **Empresas** muestra, para cada fecha, todos los clientes que
  componen ese monto con su importe entre paréntesis (ej. `Cliente A ($123.456), Cliente B ($54.321)`).
- Controles de zoom (🔍−/🔍+) para agrandar o achicar toda la página, centrados y
  persistentes (`localStorage`) entre visitas.
- Responsive: en pantallas angostas (celular) la grilla de KPIs pasa a 2 columnas, el
  header se apila y las tablas scrollean horizontalmente dentro de su propio contenedor
  en vez de desbordar la página.

## Deploy

GitHub Pages sirve `index.html` directo desde la rama `main`; `tfcarnes.html` se sirve
en la misma ruta (`/tfcarnes.html`).

Los CSS/JS de cada dashboard se referencian con un query string de versión
(`?v=AAAAMMDDx`) para evitar que el navegador quede con una copia vieja en caché.
Al hacer un cambio en un CSS o JS, subir también ese número en su HTML correspondiente.
