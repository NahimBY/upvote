import ExcelJS from 'exceljs'
import { apiFetch } from './apiFetch'

interface ElectionRow {
  _id: string
  title: string
  status: string
  type: string
  startDate: string
  endDate: string
  participation?: number
  totalVoters?: number
  totalVotes?: number
  maxVotes?: number | null
}

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX')
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  open: 'Abierta',
  closed: 'Cerrada',
  archived: 'Archivada',
}

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'Selección única',
  multiple_choice: 'Selección múltiple',
  yes_no: 'Sí / No',
}

const formatStatus = (status: string) => STATUS_LABELS[status] ?? status
const formatType = (type: string) => TYPE_LABELS[type] ?? type

// --- Color palette ---
const COLOR_PRIMARY = 'FF064E3B'
const COLOR_ACCENT = 'FF10B981'
const COLOR_SECTION = 'FFA7F3D0'
const COLOR_ZEBRA = 'FFECFDF5'
const COLOR_WHITE_ROW = 'FFFFFFFF'
const COLOR_BORDER_DARK = 'FF047857'
const COLOR_TEXT_DARK = 'FF064E3B'
const COLOR_WHITE = 'FFFFFFFF'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  abierta: { bg: 'FF6EE7B7', fg: 'FF064E3B' },
  publicada: { bg: 'FF93C5FD', fg: 'FF1E3A8A' },
  cerrada: { bg: 'FFFCD34D', fg: 'FF78350F' },
  borrador: { bg: 'FFCBD5E1', fg: 'FF1E293B' },
  archivada: { bg: 'FFD1D5DB', fg: 'FF374151' },
}

const borderMedium: ExcelJS.Borders = {
  top: { style: 'medium', color: { argb: COLOR_BORDER_DARK } },
  left: { style: 'medium', color: { argb: COLOR_BORDER_DARK } },
  bottom: { style: 'medium', color: { argb: COLOR_BORDER_DARK } },
  right: { style: 'medium', color: { argb: COLOR_BORDER_DARK } },
  diagonal: { style: 'thin' },
}

const borderThin: ExcelJS.Borders = {
  top: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
  left: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
  bottom: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
  right: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
  diagonal: { style: 'thin' },
}

const fill = (argb: string): ExcelJS.FillPattern => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
  bgColor: { argb },
})

const triggerDownload = (buffer: ArrayBuffer, filename: string) => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Apply font/fill/border/alignment via direct property assignment
// to every cell within [col1..col2] of a row. This is the most reliable
// pattern in ExcelJS — using cell.style = {...} drops some properties
// in merged ranges.
const applyRowStyle = (
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  col1: number,
  col2: number,
  styles: {
    font?: Partial<ExcelJS.Font>
    fill?: ExcelJS.FillPattern
    border?: Partial<ExcelJS.Borders>
    alignment?: Partial<ExcelJS.Alignment>
    numFmt?: string
  },
) => {
  for (let c = col1; c <= col2; c++) {
    const cell = sheet.getCell(rowNumber, c)
    if (styles.font) cell.font = styles.font as ExcelJS.Font
    if (styles.fill) cell.fill = styles.fill
    if (styles.border) cell.border = styles.border as ExcelJS.Borders
    if (styles.alignment) cell.alignment = styles.alignment as ExcelJS.Alignment
    if (styles.numFmt) cell.numFmt = styles.numFmt
  }
}

// --- Builders ---
// Order matters: style cells FIRST, then mergeCells. ExcelJS sometimes
// drops styles applied after a merge.

const addTitle = (sheet: ExcelJS.Worksheet, title: string, span: number) => {
  const row = sheet.addRow([title])
  row.height = 32
  applyRowStyle(sheet, row.number, 1, span, {
    font: { bold: true, size: 16, color: { argb: COLOR_WHITE } },
    fill: fill(COLOR_PRIMARY),
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    border: borderMedium,
  })
  sheet.mergeCells(row.number, 1, row.number, span)
  return row
}

const addSection = (sheet: ExcelJS.Worksheet, title: string, span: number) => {
  const row = sheet.addRow([title])
  row.height = 24
  applyRowStyle(sheet, row.number, 1, span, {
    font: { bold: true, size: 12, color: { argb: COLOR_TEXT_DARK } },
    fill: fill(COLOR_SECTION),
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    border: borderMedium,
  })
  sheet.mergeCells(row.number, 1, row.number, span)
  return row
}

const addHeaderRow = (sheet: ExcelJS.Worksheet, headers: string[]) => {
  const row = sheet.addRow(headers)
  row.height = 24
  applyRowStyle(sheet, row.number, 1, headers.length, {
    font: { bold: true, color: { argb: COLOR_WHITE }, size: 11 },
    fill: fill(COLOR_ACCENT),
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: borderMedium,
  })
  return row
}

interface DataRowOptions {
  index: number
  alignments?: ('left' | 'center' | 'right')[]
  numFmts?: (string | undefined)[]
  statusColumn?: number
  span: number
}

const styleDataRow = (sheet: ExcelJS.Worksheet, rowNumber: number, opts: DataRowOptions) => {
  const isZebra = opts.index % 2 === 1
  const bg = isZebra ? COLOR_ZEBRA : COLOR_WHITE_ROW
  const row = sheet.getRow(rowNumber)
  row.height = 20

  for (let c = 1; c <= opts.span; c++) {
    const cell = sheet.getCell(rowNumber, c)
    const align = opts.alignments?.[c - 1] ?? 'left'
    const numFmt = opts.numFmts?.[c - 1]

    let cellFill = fill(bg)
    let cellFont: Partial<ExcelJS.Font> = { color: { argb: COLOR_TEXT_DARK }, size: 11 }
    let cellAlignH = align

    if (opts.statusColumn === c && typeof cell.value === 'string') {
      const key = cell.value.toLowerCase()
      const colors = STATUS_COLORS[key]
      if (colors) {
        cellFill = fill(colors.bg)
        cellFont = { bold: true, color: { argb: colors.fg }, size: 11 }
        cellAlignH = 'center'
      }
    }

    cell.font = cellFont as ExcelJS.Font
    cell.fill = cellFill
    cell.border = borderThin as ExcelJS.Borders
    cell.alignment = {
      vertical: 'middle',
      horizontal: cellAlignH,
      indent: cellAlignH === 'left' ? 1 : 0,
    }
    if (numFmt) cell.numFmt = numFmt
  }
}

const addKeyValueRow = (
  sheet: ExcelJS.Worksheet,
  index: number,
  label: string,
  value: number | string,
  span: number,
  numFmt?: string,
) => {
  const row = sheet.addRow([label, value])
  const isZebra = index % 2 === 1
  const bg = isZebra ? COLOR_ZEBRA : COLOR_WHITE_ROW
  row.height = 22

  // Label cell
  const labelCell = sheet.getCell(row.number, 1)
  labelCell.font = { bold: true, color: { argb: COLOR_TEXT_DARK }, size: 11 }
  labelCell.fill = fill(bg)
  labelCell.border = borderThin as ExcelJS.Borders
  labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  // Value cell(s) — style each column of the (eventual) merged range
  for (let c = 2; c <= span; c++) {
    const cell = sheet.getCell(row.number, c)
    cell.font = { color: { argb: COLOR_TEXT_DARK }, size: 11 }
    cell.fill = fill(bg)
    cell.border = borderThin as ExcelJS.Borders
    cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
    if (numFmt && c === 2) cell.numFmt = numFmt
  }

  if (span > 2) sheet.mergeCells(row.number, 2, row.number, span)
}

const addEmptyRow = (sheet: ExcelJS.Worksheet, message: string, span: number) => {
  const row = sheet.addRow([message])
  row.height = 24
  applyRowStyle(sheet, row.number, 1, span, {
    font: { italic: true, color: { argb: 'FF94A3B8' }, size: 11 },
    fill: fill(COLOR_WHITE_ROW),
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: borderThin,
  })
  sheet.mergeCells(row.number, 1, row.number, span)
}

const addSpacer = (sheet: ExcelJS.Worksheet) => {
  const row = sheet.addRow([])
  row.height = 10
}

export async function downloadOrganizatorReport() {
  const [overviewRes, dashRes, electionsRes, timelineRes, upcomingRes] = await Promise.all([
    apiFetch('/api/organizator/stats/overview'),
    apiFetch('/api/organizator/dashboard'),
    apiFetch('/api/organizator/elections'),
    apiFetch('/api/organizator/stats/votes-timeline?days=30'),
    apiFetch('/api/organizator/elections/upcoming'),
  ])

  const overview = (await safeJson(overviewRes))?.data ?? null
  const dashboard = (await safeJson(dashRes))?.data ?? null
  const elections: ElectionRow[] = (await safeJson(electionsRes))?.data ?? []
  const timeline: { date: string; count: number }[] =
    (await safeJson(timelineRes))?.data?.timeline ?? []
  const upcoming: ElectionRow[] = (await safeJson(upcomingRes))?.data ?? []

  const electionsWithStats: ElectionRow[] = await Promise.all(
    elections.map(async (e) => {
      try {
        const r = await apiFetch(`/api/organizator/elections/${e._id}/participation`)
        if (!r.ok) return e
        const data = (await safeJson(r))?.data
        return data ? { ...e, ...data } : e
      } catch {
        return e
      }
    }),
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'UpVote'
  workbook.created = new Date()

  // ============================================================
  // Dashboard sheet
  // ============================================================
  const dashSheet = workbook.addWorksheet('Dashboard', {
    views: [{ showGridLines: false }],
  })
  const DASH_COLS = 4
  dashSheet.columns = [
    { width: 38 },
    { width: 18 },
    { width: 28 },
    { width: 18 },
  ]
  addTitle(dashSheet, 'Cifras Generales', DASH_COLS)
  addSpacer(dashSheet)
  addSection(dashSheet, 'Métricas principales', DASH_COLS)
  addKeyValueRow(dashSheet, 0, 'Total de Votos (Mis Salas)', dashboard?.stats?.totalVotes ?? 0, DASH_COLS)
  addKeyValueRow(dashSheet, 1, 'Mis Salas Activas', dashboard?.stats?.activeRooms ?? 0, DASH_COLS)
  addKeyValueRow(dashSheet, 2, 'Total de Salas', overview?.totalElections ?? 0, DASH_COLS)
  addKeyValueRow(
    dashSheet,
    3,
    'Participación Promedio',
    (overview?.averageParticipation ?? 0) / 100,
    DASH_COLS,
    '0.0%',
  )
  addSpacer(dashSheet)

  addSection(dashSheet, 'Actividad Reciente', DASH_COLS)
  addHeaderRow(dashSheet, ['Usuario', 'Acción', 'Sala', 'Hace'])
  const activity = dashboard?.recentActivity ?? []
  if (activity.length === 0) {
    addEmptyRow(dashSheet, 'Sin actividad reciente', DASH_COLS)
  } else {
    activity.forEach((a: any, idx: number) => {
      const row = dashSheet.addRow([a.user ?? '', a.action ?? '', a.room ?? '', a.time ?? ''])
      styleDataRow(dashSheet, row.number, {
        index: idx,
        alignments: ['left', 'left', 'left', 'right'],
        span: DASH_COLS,
      })
    })
  }

  // ============================================================
  // Salas de Votación sheet
  // ============================================================
  const salasSheet = workbook.addWorksheet('Salas de Votación', {
    views: [{ showGridLines: false }],
  })
  const SALAS_COLS = 8
  salasSheet.columns = [
    { width: 42 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 18 },
  ]
  addTitle(salasSheet, 'Salas de Votación', SALAS_COLS)
  addSpacer(salasSheet)
  const salasHeaderRow = addHeaderRow(salasSheet, [
    'Título',
    'Estado',
    'Tipo',
    'Inicio',
    'Fin',
    'Votos',
    'Máx',
    'Participación',
  ])
  if (electionsWithStats.length === 0) {
    addEmptyRow(salasSheet, 'No tienes salas creadas', SALAS_COLS)
  } else {
    electionsWithStats.forEach((e, idx) => {
      const row = salasSheet.addRow([
        e.title ?? '',
        formatStatus(e.status ?? ''),
        formatType(e.type ?? ''),
        formatDate(e.startDate),
        formatDate(e.endDate),
        e.totalVotes ?? 0,
        e.totalVoters ?? e.maxVotes ?? '—',
        (e.participation ?? 0) / 100,
      ])
      styleDataRow(salasSheet, row.number, {
        index: idx,
        alignments: ['left', 'center', 'center', 'center', 'center', 'right', 'right', 'right'],
        numFmts: [undefined, undefined, undefined, undefined, undefined, '0', '0', '0.0%'],
        statusColumn: 2,
        span: SALAS_COLS,
      })
    })
    salasSheet.autoFilter = {
      from: { row: salasHeaderRow.number, column: 1 },
      to: { row: salasHeaderRow.number + electionsWithStats.length, column: SALAS_COLS },
    }
  }
  salasSheet.views = [{ state: 'frozen', ySplit: salasHeaderRow.number, showGridLines: false }]

  // ============================================================
  // Estadísticas sheet
  // ============================================================
  const statsSheet = workbook.addWorksheet('Estadísticas', {
    views: [{ showGridLines: false }],
  })
  const STATS_COLS = 4
  statsSheet.columns = [
    { width: 38 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ]
  addTitle(statsSheet, 'Estadísticas Globales', STATS_COLS)
  addSpacer(statsSheet)

  addSection(statsSheet, 'Resumen', STATS_COLS)
  addKeyValueRow(statsSheet, 0, 'Total de salas', overview?.totalElections ?? 0, STATS_COLS)
  addKeyValueRow(statsSheet, 1, 'Votos emitidos', overview?.totalVotes ?? 0, STATS_COLS)
  addKeyValueRow(statsSheet, 2, 'Activas / publicadas', overview?.activeElections ?? 0, STATS_COLS)
  addKeyValueRow(statsSheet, 3, 'Borradores', overview?.draftElections ?? 0, STATS_COLS)
  addKeyValueRow(statsSheet, 4, 'Cerradas', overview?.closedElections ?? 0, STATS_COLS)
  addKeyValueRow(statsSheet, 5, 'Archivadas', overview?.archivedElections ?? 0, STATS_COLS)
  addKeyValueRow(
    statsSheet,
    6,
    'Participación promedio',
    (overview?.averageParticipation ?? 0) / 100,
    STATS_COLS,
    '0.0%',
  )
  addSpacer(statsSheet)

  addSection(statsSheet, 'Distribución por estado', STATS_COLS)
  addHeaderRow(statsSheet, ['Estado', 'Cantidad', '', ''])
  const statusEntries = Object.entries(overview?.byStatus ?? {})
  statusEntries.forEach(([status, count], idx) => {
    const row = statsSheet.addRow([formatStatus(status), count as number, '', ''])
    styleDataRow(statsSheet, row.number, {
      index: idx,
      alignments: ['center', 'right', 'center', 'center'],
      statusColumn: 1,
      span: STATS_COLS,
    })
  })
  addSpacer(statsSheet)

  addSection(statsSheet, 'Tendencia de votos (últimos 30 días)', STATS_COLS)
  addHeaderRow(statsSheet, ['Fecha', 'Votos', '', ''])
  timeline.forEach((b, idx) => {
    const row = statsSheet.addRow([b.date, b.count, '', ''])
    styleDataRow(statsSheet, row.number, {
      index: idx,
      alignments: ['center', 'right', 'center', 'center'],
      span: STATS_COLS,
    })
  })
  addSpacer(statsSheet)

  addSection(statsSheet, 'Próximas salas', STATS_COLS)
  addHeaderRow(statsSheet, ['Título', 'Estado', 'Inicio', 'Fin'])
  if (upcoming.length === 0) {
    addEmptyRow(statsSheet, 'No hay salas próximas', STATS_COLS)
  } else {
    upcoming.forEach((e, idx) => {
      const row = statsSheet.addRow([
        e.title ?? '',
        formatStatus(e.status ?? ''),
        formatDate(e.startDate),
        formatDate(e.endDate),
      ])
      styleDataRow(statsSheet, row.number, {
        index: idx,
        alignments: ['left', 'center', 'center', 'center'],
        statusColumn: 2,
        span: STATS_COLS,
      })
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const stamp = new Date().toISOString().slice(0, 10)
  triggerDownload(buffer as ArrayBuffer, `upvote-reporte-${stamp}.xlsx`)
}
