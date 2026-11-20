using System.Globalization;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Xml;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;
using SOMS.Application.Common.Models;
using static SOMS.Infrastructure.Services.Tv4Session;

namespace SOMS.Infrastructure.Services;

public static class Tv4Export
{
    private static readonly object FontLock = new();
    private sealed class NotoFontResolver : IFontResolver
    {
        private static readonly Lazy<byte[]> FontBytes = new(() =>
        {
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("SOMS.Infrastructure.Assets.NotoSans-Regular.ttf") ?? throw new InvalidOperationException("Bundled Noto Sans font is missing.");
            using var buffer = new MemoryStream();
            stream.CopyTo(buffer);
            return buffer.ToArray();
        });
        public byte[] GetFont(string faceName) => FontBytes.Value;
        public FontResolverInfo ResolveTypeface(string familyName, bool bold, bool italic) => new("SomsNotoSans");
    }
    public static Tv4File Create(string title, string[] headers, object?[][] rows, string format, string name)
    {
        Choice(format, "xlsx", "pdf");
        return format == "xlsx" ? new(Xlsx(title, headers, rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name + ".xlsx") : new(Pdf(title, headers, rows), "application/pdf", name + ".pdf");
    }
    private static string Text(object? value) => value switch
    {
        DateOnly date => date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
        DateTime date => date.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture),
        DateTimeOffset date => date.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture),
        decimal amount => amount.ToString("N2", CultureInfo.GetCultureInfo("vi-VN")),
        _ => value?.ToString() ?? string.Empty
    };
    private static byte[] Pdf(string title, string[] headers, object?[][] rows)
    {
        lock (FontLock) { GlobalFontSettings.FontResolver ??= new NotoFontResolver(); }
        using var document = new PdfDocument(); document.Info.Title = title; document.Info.Author = "SOMS";
        var font = new XFont("SomsNotoSans", 9); var heading = new XFont("SomsNotoSans", 15); var headerFont = new XFont("SomsNotoSans", 9);
        XGraphics? graphics = null; double y = 0; double width = 0; double columnWidth = 0; int pageNumber = 0;
        void Page()
        {
            graphics?.Dispose(); var page = document.AddPage(); page.Size = PdfSharp.PageSize.A4; page.Orientation = PdfSharp.PageOrientation.Landscape; graphics = XGraphics.FromPdfPage(page); pageNumber++; width = page.Width.Point - 64; columnWidth = width / headers.Length;
            graphics.DrawString(title, heading, XBrushes.Black, new XRect(32, 22, width, 26), XStringFormats.TopLeft);
            graphics.DrawString($"SOMS | {pageNumber}", font, XBrushes.Gray, new XRect(32, page.Height.Point - 26, width, 15), XStringFormats.TopLeft);
            y = 60; for (var i = 0; i < headers.Length; i++) graphics.DrawString(headers[i], headerFont, XBrushes.Black, new XRect(35 + i * columnWidth, y, columnWidth - 6, 18), XStringFormats.TopLeft); y += 23; graphics.DrawLine(XPens.Gray, 32, y - 4, 32 + width, y - 4);
        }
        List<string> Wrap(string text)
        {
            var lines = new List<string>(); foreach (var paragraph in text.Replace("\r", "").Split('\n'))
            { var line = ""; foreach (var word in paragraph.Split(' ')) { if (graphics!.MeasureString(line.Length == 0 ? word : line + " " + word, font).Width > columnWidth - 7 && line.Length != 0) { lines.Add(line); line = ""; } foreach (var ch in word) { if (graphics.MeasureString(line + ch, font).Width > columnWidth - 7) { lines.Add(line); line = ""; } line += ch; } line += " "; } lines.Add(line.TrimEnd()); }
            return lines;
        }
        Page(); foreach (var row in rows)
        {
            var wrapped = Enumerable.Range(0, headers.Length).Select(i => Wrap(i < row.Length ? Text(row[i]) : "")).ToArray(); var lines = wrapped.Max(c => c.Count); var offset = 0;
            while (offset < lines)
            {
                var available = (int)Math.Floor((document.Pages[document.PageCount - 1].Height.Point - 45 - y) / 13); if (available < 1) { Page(); continue; }
                var count = Math.Min(lines - offset, available);
                for (var c = 0; c < wrapped.Length; c++) for (var n = 0; n < count && offset + n < wrapped[c].Count; n++) graphics!.DrawString(wrapped[c][offset + n], font, XBrushes.Black, new XRect(35 + c * columnWidth, y + n * 13, columnWidth - 6, 13), XStringFormats.TopLeft);
                y += count * 13; offset += count; if (offset < lines) Page();
            }
            y += 7; graphics!.DrawLine(XPens.LightGray, 32, y - 3, 32 + width, y - 3);
        }
        if (rows.Length == 0) graphics!.DrawString("Không có dữ liệu phù hợp.", font, XBrushes.Black, new XRect(35, y, width, 20), XStringFormats.TopLeft);
        graphics?.Dispose(); using var output = new MemoryStream(); document.Save(output, false); return output.ToArray();
    }
    private static byte[] Xlsx(string title, string[] headers, object?[][] rows)
    {
        using var output = new MemoryStream(); using (var zip = new ZipArchive(output, ZipArchiveMode.Create, true))
        {
            void Part(string path, string xml) { using var writer = new StreamWriter(zip.CreateEntry(path).Open(), new UTF8Encoding(false)); writer.Write(xml); }
            Part("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/></Types>");
            Part("_rels/.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
            Part("xl/workbook.xml", "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"SOMS\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
            Part("xl/_rels/workbook.xml.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/></Relationships>");
            Part("xl/styles.xml", "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts><fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills><borders count=\"1\"><border/></borders><cellStyleXfs count=\"1\"><xf/></cellStyleXfs><cellXfs count=\"3\"><xf fontId=\"0\"/><xf fontId=\"1\" applyFont=\"1\"/><xf numFmtId=\"4\" applyNumberFormat=\"1\"/></cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>");
            using var sheet = zip.CreateEntry("xl/worksheets/sheet1.xml").Open(); using var xml = XmlWriter.Create(sheet, new XmlWriterSettings { Encoding = new UTF8Encoding(false) }); const string ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
            xml.WriteStartDocument(); xml.WriteStartElement("worksheet", ns); xml.WriteStartElement("sheetViews"); xml.WriteStartElement("sheetView"); xml.WriteAttributeString("workbookViewId", "0"); xml.WriteStartElement("pane"); xml.WriteAttributeString("ySplit", "2"); xml.WriteAttributeString("topLeftCell", "A3"); xml.WriteAttributeString("state", "frozen"); xml.WriteEndElement(); xml.WriteEndElement(); xml.WriteEndElement(); xml.WriteStartElement("cols"); xml.WriteStartElement("col"); xml.WriteAttributeString("min", "1"); xml.WriteAttributeString("max", headers.Length.ToString(CultureInfo.InvariantCulture)); xml.WriteAttributeString("width", "24"); xml.WriteAttributeString("customWidth", "1"); xml.WriteEndElement(); xml.WriteEndElement(); xml.WriteStartElement("sheetData");
            void Row(object?[] values, bool bold = false)
            {
                xml.WriteStartElement("row"); foreach (var value in values) { xml.WriteStartElement("c"); var numeric = value is decimal or int or long or double; xml.WriteAttributeString("s", numeric ? "2" : bold ? "1" : "0"); if (numeric) { xml.WriteElementString("v", Convert.ToString(value, CultureInfo.InvariantCulture)); } else { xml.WriteAttributeString("t", "inlineStr"); xml.WriteStartElement("is"); xml.WriteStartElement("t"); xml.WriteAttributeString("xml", "space", null, "preserve"); xml.WriteString(Text(value)); xml.WriteEndElement(); xml.WriteEndElement(); } xml.WriteEndElement(); }
                xml.WriteEndElement();
            }
            Row(new object?[] { title }, true); Row(headers.Cast<object?>().ToArray(), true); foreach (var row in rows) Row(row); xml.WriteEndElement(); xml.WriteEndElement(); xml.WriteEndDocument();
        }
        return output.ToArray();
    }
}
