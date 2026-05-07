/**
 * Export Utils — Exportar datos a CSV y PDF
 *
 * CSV: nativo, sin dependencias, compatible con Excel (UTF-8 BOM)
 * PDF: abre ventana nueva con tabla estilizada y llama a window.print()
 *      El usuario guarda como PDF desde el dialogo de impresion del navegador
 */

/**
 * Exporta una tabla de datos como archivo CSV.
 * @param filename - nombre del archivo (sin extension)
 * @param headers - encabezados de columna
 * @param rows    - filas de datos (strings)
 */
export function exportarCSV(filename: string, headers: string[], rows: string[][]): void {
  const BOM = "\uFEFF" // UTF-8 BOM para compatibilidad con Excel
  const encode = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const content = [headers, ...rows].map(r => r.map(encode).join(",")).join("\r\n")
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Abre una ventana con la tabla lista para imprimir/guardar como PDF.
 * @param titulo  - titulo del reporte
 * @param headers - encabezados de columna
 * @param rows    - filas de datos (strings)
 */
export function exportarPDF(titulo: string, headers: string[], rows: string[][]): void {
  const w = window.open("", "_blank", "width=900,height=700")
  if (!w) return

  const fecha = new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
  const th = headers.map(h => `<th>${h}</th>`).join("")
  const tbody = rows
    .map(r => `<tr>${r.map(c => `<td>${c ?? ""}</td>`).join("")}</tr>`)
    .join("")

  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f0f4f8; }
    th { padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase;
         letter-spacing: 0.06em; border-bottom: 2px solid #d0d7de; }
    td { padding: 7px 10px; border-bottom: 1px solid #e8ecf0; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fbfc; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  <div class="meta">Generado el ${fecha} &middot; Lumina Sistema de Asistencia</div>
  <table>
    <thead><tr>${th}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  <script>
    window.addEventListener("load", function() { window.print(); });
  </script>
</body>
</html>`)
  w.document.close()
}
