/**
 * Minimal, dependency-free XLSX writer.
 *
 * It emits the subset of SpreadsheetML needed by the daily-report workbook:
 * multiple worksheets, inline strings, numbers, frozen header rows, auto
 * filters, column widths, merged cells and a small fixed style palette.
 */

import { deflateRawSync } from "node:zlib";

const encoder = new TextEncoder();

const STYLE_DEFAULT = 0;
const STYLE_HEADER = 1;
const STYLE_BODY = 2;
const STYLE_CENTER = 3;
const STYLE_BOLD = 4;
const STYLE_WEEKEND = 5;
const STYLE_SECTION = 6;
const STYLE_NOTE = 7;
const STYLE_TITLE = 8;
const STYLE_CENTER_BOLD = 9;
const STYLE_TOTAL = 10;
const STYLE_TOTAL_CENTER = 11;

export const styles = {
  default: STYLE_DEFAULT,
  header: STYLE_HEADER,
  body: STYLE_BODY,
  center: STYLE_CENTER,
  bold: STYLE_BOLD,
  weekend: STYLE_WEEKEND,
  section: STYLE_SECTION,
  note: STYLE_NOTE,
  title: STYLE_TITLE,
  centerBold: STYLE_CENTER_BOLD,
  total: STYLE_TOTAL,
  totalCenter: STYLE_TOTAL_CENTER,
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sanitizeSheetName(name, used) {
  let base = String(name || "Sheet")
    .replace(/[\[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || "Sheet";
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    const tail = " (" + suffix + ")";
    candidate = base.slice(0, 31 - tail.length) + tail;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

let crcTable = null;
function crc32(buffer) {
  if (crcTable === null) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function zip(files) {
  const now = new Date();
  const { dosTime, dosDate } = dosDateTime(now);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const raw = Buffer.isBuffer(file.data) ? file.data : Buffer.from(String(file.data), "utf8");
    const compressed = deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBytes, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);

    offset += local.length + nameBytes.length + compressed.length;
  }

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function cellXml(ref, value, style) {
  const s = Number.isInteger(style) ? style : STYLE_DEFAULT;
  if (value === null || value === undefined || value === "") {
    return s === STYLE_DEFAULT ? "" : '<c r="' + ref + '" s="' + s + '"/>';
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return '<c r="' + ref + '" s="' + s + '"><v>' + value + "</v></c>";
  }
  if (typeof value === "boolean") {
    return '<c r="' + ref + '" s="' + s + '" t="b"><v>' + (value ? 1 : 0) + "</v></c>";
  }
  const text = String(value).slice(0, 32767);
  return '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + escapeXml(text) + "</t></is></c>";
}

function sheetXml(sheet, index) {
  const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
  const widths = Array.isArray(sheet.widths) ? sheet.widths : [];
  const rowStyles = sheet.rowStyles || {};
  const headerRows = Number.isInteger(sheet.headerRows) ? sheet.headerRows : 1;
  const maxCols = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 1);
  const lastCell = columnName(Math.max(0, maxCols - 1)) + Math.max(1, rows.length);

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  parts.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  parts.push('<dimension ref="A1:' + lastCell + '"/>');
  parts.push('<sheetViews><sheetView' + (index === 0 ? ' tabSelected="1"' : "") + ' workbookViewId="0">');
  const freezeColumns = Number.isInteger(sheet.freezeColumns) ? Math.max(0, sheet.freezeColumns) : 0;
  if (sheet.freeze !== false && (headerRows > 0 || freezeColumns > 0)) {
    const paneAttrs = [];
    if (freezeColumns > 0) paneAttrs.push('xSplit="' + freezeColumns + '"');
    if (headerRows > 0) paneAttrs.push('ySplit="' + headerRows + '"');
    paneAttrs.push('topLeftCell="' + columnName(freezeColumns) + (headerRows + 1) + '"');
    paneAttrs.push('activePane="' + (freezeColumns > 0 ? (headerRows > 0 ? "bottomRight" : "topRight") : "bottomLeft") + '"');
    paneAttrs.push('state="frozen"');
    parts.push("<pane " + paneAttrs.join(" ") + "/>");
  }
  parts.push("</sheetView></sheetViews>");
  parts.push('<sheetFormatPr defaultRowHeight="18"/>');

  if (widths.length > 0) {
    parts.push("<cols>");
    for (let c = 0; c < widths.length; c += 1) {
      const width = Number(widths[c]);
      if (Number.isFinite(width) && width > 0) {
        parts.push('<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + width + '" customWidth="1"/>');
      }
    }
    parts.push("</cols>");
  }

  parts.push("<sheetData>");
  for (let r = 0; r < rows.length; r += 1) {
    const row = Array.isArray(rows[r]) ? rows[r] : [];
    let baseStyle = STYLE_BODY;
    if (r < headerRows) baseStyle = STYLE_HEADER;
    if (Object.prototype.hasOwnProperty.call(rowStyles, r)) {
      baseStyle = rowStyles[r];
    }
    const height = r < headerRows ? ' ht="24" customHeight="1"' : "";
    parts.push('<row r="' + (r + 1) + '"' + height + ">");
    for (let c = 0; c < row.length; c += 1) {
      const raw = row[c];
      let value = raw;
      let style = baseStyle;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.prototype.hasOwnProperty.call(raw, "value")) {
        value = raw.value;
        if (Number.isInteger(raw.style)) style = raw.style;
      }
      parts.push(cellXml(columnName(c) + (r + 1), value, style));
    }
    parts.push("</row>");
  }
  parts.push("</sheetData>");

  if (sheet.filter !== false && rows.length > 1 && maxCols > 0) {
    parts.push('<autoFilter ref="A1:' + columnName(maxCols - 1) + rows.length + '"/>');
  }

  if (Array.isArray(sheet.merges) && sheet.merges.length > 0) {
    parts.push('<mergeCells count="' + sheet.merges.length + '">');
    for (const ref of sheet.merges) {
      parts.push('<mergeCell ref="' + escapeXml(ref) + '"/>');
    }
    parts.push("</mergeCells>");
  }

  parts.push('<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>');
  parts.push("</worksheet>");
  return parts.join("");
}

function stylesXml() {
  const fonts = [
    '<font><sz val="10"/><name val="Microsoft YaHei"/><family val="2"/></font>',
    '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/><family val="2"/></font>',
    '<font><b/><sz val="10"/><name val="Microsoft YaHei"/><family val="2"/></font>',
    '<font><b/><sz val="14"/><name val="Microsoft YaHei"/><family val="2"/></font>',
    '<font><b/><sz val="11"/><name val="Microsoft YaHei"/><family val="2"/></font>',
  ];
  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF7"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>',
  ];
  const border = '<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>';
  const xfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<fonts count="' + fonts.length + '">' + fonts.join("") + "</fonts>",
    '<fills count="' + fills.length + '">' + fills.join("") + "</fills>",
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' + border + "</borders>",
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    '<cellXfs count="' + xfs.length + '">' + xfs.join("") + "</cellXfs>",
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
    '<dxfs count="0"/>',
    '<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>',
    "</styleSheet>",
  ].join("");
}

function workbookXml(sheets) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<bookViews><workbookView activeTab="0"/></bookViews>',
    '<sheets>',
  ];
  for (let i = 0; i < sheets.length; i += 1) {
    parts.push('<sheet name="' + escapeXml(sheets[i].name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>');
  }
  parts.push("</sheets>", "</workbook>");
  return parts.join("");
}

function workbookRels(sheets) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
  ];
  for (let i = 0; i < sheets.length; i += 1) {
    parts.push('<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>');
  }
  parts.push('<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');
  parts.push("</Relationships>");
  return parts.join("");
}

function contentTypes(sheets) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
  ];
  for (let i = 0; i < sheets.length; i += 1) {
    parts.push('<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
  }
  parts.push("</Types>");
  return parts.join("");
}

function packageRels() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    "</Relationships>",
  ].join("");
}

function coreXml(title) {
  const now = new Date().toISOString();
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    "<dc:title>" + escapeXml(title) + "</dc:title>",
    "<dc:creator>DSH daily-report plugin</dc:creator>",
    '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + "</dcterms:created>",
    '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + "</dcterms:modified>",
    "</cp:coreProperties>",
  ].join("");
}

function appXml(sheets) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    "<Application>DSH</Application>",
    "<HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>" + sheets.length + "</vt:i4></vt:variant></vt:vector></HeadingPairs>",
    "<TitlesOfParts><vt:vector size=\"" + sheets.length + "\" baseType=\"lpstr\">",
  ];
  for (const sheet of sheets) {
    parts.push("<vt:lpstr>" + escapeXml(sheet.name) + "</vt:lpstr>");
  }
  parts.push("</vt:vector></TitlesOfParts>", "</Properties>");
  return parts.join("");
}

export function buildXlsx(sheetDefinitions, options = {}) {
  if (!Array.isArray(sheetDefinitions) || sheetDefinitions.length === 0) {
    throw new Error("buildXlsx requires at least one sheet");
  }
  const used = new Set();
  const sheets = sheetDefinitions.map((sheet) => ({
    ...sheet,
    name: sanitizeSheetName(sheet.name, used),
    rows: Array.isArray(sheet.rows) ? sheet.rows : [],
  }));

  const files = [
    { name: "[Content_Types].xml", data: contentTypes(sheets) },
    { name: "_rels/.rels", data: packageRels() },
    { name: "docProps/core.xml", data: coreXml(options.title || "Daily report") },
    { name: "docProps/app.xml", data: appXml(sheets) },
    { name: "xl/workbook.xml", data: workbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", data: workbookRels(sheets) },
    { name: "xl/styles.xml", data: stylesXml() },
  ];
  for (let i = 0; i < sheets.length; i += 1) {
    files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: sheetXml(sheets[i], i) });
  }
  return zip(files);
}
