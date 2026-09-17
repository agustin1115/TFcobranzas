# Trade Food · Cuentas a Cobrar Proyectadas

App estática (sin build, sin dependencias) que muestra una proyección estilo cash flow
de las cuentas a cobrar de Trade Food, leyendo en vivo desde Google Sheets.

## Estructura

- `index.html` — markup
- `css/style.css` — estilos (mismos tokens de marca que el panel Trade Food de [cashflow-tesoreria](https://github.com/agustin1115/cashflow-tesoreria))
- `js/app.js` — lógica: lectura JSONP del Sheet, clasificación de clientes y cálculo de la proyección

## Datos

Lee en vivo, vía JSONP (`gviz/tq`), las pestañas `A` y `B` del mismo Google Sheet que usa
el sistema de Cobranzas completo. El Sheet debe estar compartido como
**"Cualquiera con el vínculo puede ver"** para que funcione.

- Se excluyen las cuentas de `CLIENTES_EXCLUIDOS` (proveedores, seguros, empleados, etc. —
  no son clientes reales).
- Los clientes de `CLIENTES_DIFICIL_COBRO` quedan afuera del "Total a cobrar" normal y se
  muestran aparte, igual que en el Resumen Ejecutivo del sistema de Cobranzas.
- Un cliente entra a la proyección de un archivo (A o B) si tiene deuda pendiente en
  **cualquiera de los dos archivos** (combinados); recién ahí se le netea el "a aplicar"
  (notas de crédito) propio de cada archivo. Esto replica exactamente la lógica de
  `updateMetrics()` del sistema de Cobranzas, verificado contra el Resumen Ejecutivo real.

## Vista

- **Archivo A** (arriba) y **Archivo B** (abajo), cada uno con su propia grilla de KPIs
  (Total a cobrar / Próx. 7 días / De 7 a 15 días / Más de 15 días) y su tabla de
  proyección (Fecha | Cuenta a cobrar), con el mismo formato visual que la tabla de
  cash flow de cashflow-tesoreria.

## Deploy

GitHub Pages sirve `index.html` directo desde la rama `main`.

`css/style.css` y `js/app.js` se referencian con un query string de versión
(`?v=AAAAMMDDx`) para evitar que el navegador quede con una copia vieja en caché.
Al hacer un cambio en CSS o JS, subir también ese número en `index.html`.
