/**
 * PDF Generator — jsPDF + jspdf-autotable
 *
 * জরুরি নোট: jsPDF-এর built-in fonts (Helvetica, Times, Courier)
 * বাংলা Unicode রেন্ডার করতে পারে না — গার্বেজ আসে।
 * সমাধান: সব fixed label ইংরেজিতে লেখা।
 * User-entered বাংলা text (description, name) — সেগুলো
 * PDF-এ "see app" note দিয়ে Tag ID দিয়ে রেফার করা হয়।
 * অথবা user যদি ইংরেজিতে লেখে তাহলে সরাসরি দেখাবে।
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Color Palette ─────────────────────────────────────────────────
const C = {
  bg:      [8,  12, 24],
  surface: [15, 20, 35],
  alt:     [20, 27, 45],
  border:  [30, 41, 59],
  text:    [203, 213, 225],
  muted:   [100, 116, 139],
  amber:   [245, 158, 11],
  green:   [52,  211, 153],
  red:     [248, 113, 113],
  sky:     [56,  189, 248],
  white:   [255, 255, 255],
};

// ── Safe ASCII filter: strip non-latin chars so PDF doesn't garble ─
function safe(str) {
  if (!str) return "-";
  // Keep printable ASCII + common punctuation
  const result = String(str).replace(/[^\x20-\x7E]/g, "?");
  return result.trim() || "-";
}

// ── Format money ──────────────────────────────────────────────────
function bdt(n) {
  return "BDT " + Number(n || 0).toLocaleString("en-BD");
}

// ── Page header ───────────────────────────────────────────────────
function pageHeader(doc, title, subtitle) {
  // Dark bg
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 30, "F");
  // Amber accent bar
  doc.setFillColor(...C.amber);
  doc.rect(0, 29.5, 210, 1.5, "F");
  // Left: farm name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.amber);
  doc.text("SMART CATTLE FARM", 14, 9);
  // Title
  doc.setFontSize(15);
  doc.setTextColor(...C.white);
  doc.text(title, 14, 18);
  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text(subtitle, 14, 25);
  // Right: date
  doc.setTextColor(...C.amber);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("en-BD", { day:"2-digit", month:"short", year:"numeric" }), 196, 18, { align: "right" });
}

// ── Section heading bar ───────────────────────────────────────────
function sectionBar(doc, label, y) {
  doc.setFillColor(...C.surface);
  doc.rect(14, y, 182, 7, "F");
  doc.setFillColor(...C.amber);
  doc.rect(14, y, 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.amber);
  doc.text(label, 19, y + 4.8);
  return y + 11;
}

// ── KPI box ───────────────────────────────────────────────────────
function kpiBox(doc, label, value, x, y, color = C.amber) {
  doc.setFillColor(...C.surface);
  doc.roundedRect(x, y, 43, 17, 2, 2, "F");
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, 43, 17, 2, 2, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text(label.toUpperCase(), x + 3, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...color);
  // Truncate long values
  const val = String(value).length > 14 ? String(value).slice(0, 13) + "…" : String(value);
  doc.text(val, x + 3, y + 13);
}

// ── Table theme ───────────────────────────────────────────────────
const tableTheme = {
  theme: "grid",
  headStyles: {
    fillColor: C.surface,
    textColor: C.amber,
    fontStyle: "bold",
    fontSize: 7.5,
    cellPadding: 3,
  },
  bodyStyles: {
    fillColor: C.surface,
    textColor: C.text,
    fontSize: 7,
    cellPadding: 2.5,
  },
  alternateRowStyles: { fillColor: C.alt },
  tableLineColor: C.border,
  tableLineWidth: 0.2,
  margin: { left: 14, right: 14 },
};

// ── Footer on every page ──────────────────────────────────────────
function addFooters(doc) {
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.bg);
    doc.rect(0, 284, 210, 14, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text("Smart Cattle Farm Management System  —  Confidential", 14, 291);
    doc.text(`Page ${i} / ${n}`, 196, 291, { align: "right" });
  }
}

// ════════════════════════════════════════════════════════════════════
// REPORT 1: Monthly Full Report (Admin / Worker)
// ════════════════════════════════════════════════════════════════════
export function generateMonthlyReport({ cattle, milkLogs, expenses, incomes, stats }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const month = new Date().toLocaleDateString("en-BD", { month: "long", year: "numeric" });

  pageHeader(doc, "Monthly Farm Report", `Reporting Period: ${month}`);

  let y = 38;

  // ── KPI row 1 ─────────────────────────────────────────────────
  y = sectionBar(doc, "OVERVIEW", y);
  const milkRev = milkLogs.reduce((s, l) => s + l.sold * l.pricePerLiter, 0);
  kpiBox(doc, "Total Cattle",    stats.totalCattle,                             14,  y, C.amber);
  kpiBox(doc, "Monthly Income",  bdt(stats.monthlyIncome),                      61,  y, C.green);
  kpiBox(doc, "Monthly Expense", bdt(stats.monthlyExpense),                     108, y, C.red);
  kpiBox(doc, "Net Profit",      bdt(stats.netProfit), 155, y, stats.netProfit >= 0 ? C.green : C.red);
  y += 22;
  kpiBox(doc, "Healthy",   stats.healthyCattle, 14,  y, C.green);
  kpiBox(doc, "Sick",      stats.sickCattle,    61,  y, C.red);
  kpiBox(doc, "For Sale",  stats.forSaleCattle, 108, y, C.amber);
  kpiBox(doc, "Milk Rev.", bdt(milkRev),         155, y, C.sky);
  y += 26;

  // ── Cattle table ───────────────────────────────────────────────
  y = sectionBar(doc, "CATTLE INVENTORY", y);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Tag ID", "Name", "Breed", "Type", "Age", "Weight(kg)", "Status", "Buy Price"]],
    body: cattle.map((c) => [
      c.tagId,
      safe(c.name),
      safe(c.breed),
      c.type === "dairy" ? "Dairy" : "Fattening",
      `${c.age} yrs`,
      c.weight?.[c.weight.length - 1]?.value ?? "-",
      c.status === "healthy" ? "Healthy" : c.status === "sick" ? "Sick" : "For Sale",
      bdt(c.purchasePrice),
    ]),
    columnStyles: {
      0: { textColor: C.amber, fontStyle: "bold" },
      6: { textColor: C.green },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Milk log ───────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); pageHeader(doc, "Monthly Farm Report", `${month} — continued`); y = 38; }
  y = sectionBar(doc, "MILK PRODUCTION LOG (recent 10 days)", y);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Date", "Produced (L)", "Sold (L)", "Stock (L)", "Price/L (BDT)", "Revenue"]],
    body: milkLogs.slice(0, 10).map((l) => [
      l.date,
      l.produced,
      l.sold,
      l.produced - l.sold,
      l.pricePerLiter,
      bdt(l.sold * l.pricePerLiter),
    ]),
    columnStyles: {
      1: { textColor: C.sky },
      2: { textColor: C.green },
      5: { textColor: C.amber, fontStyle: "bold" },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Expenses ───────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); pageHeader(doc, "Monthly Farm Report", `${month} — continued`); y = 38; }
  y = sectionBar(doc, "EXPENSE BREAKDOWN", y);
  const catMap = { feed: "Animal Feed", medical: "Medical", labor: "Labor", electricity: "Electricity", other: "Other" };
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Date", "Category", "Amount", "% of Total", "Description"]],
    body: expenses.map((e) => [
      e.date,
      catMap[e.category] || e.category,
      bdt(e.amount),
      stats.monthlyExpense > 0 ? `${Math.round((e.amount / stats.monthlyExpense) * 100)}%` : "0%",
      safe(e.description),   // ← safe() strips Bengali garble
    ]),
    foot: [["", "TOTAL", bdt(stats.monthlyExpense), "100%", ""]],
    footStyles: { fillColor: C.surface, textColor: C.amber, fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      2: { textColor: C.red },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Income ────────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); pageHeader(doc, "Monthly Farm Report", `${month} — continued`); y = 38; }
  y = sectionBar(doc, "INCOME DETAILS", y);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Date", "Source", "Amount", "Description"]],
    body: incomes.map((i) => [
      i.date,
      safe(i.source),
      bdt(i.amount),
      safe(i.description),
    ]),
    foot: [["", "TOTAL", bdt(stats.monthlyIncome), ""]],
    footStyles: { fillColor: C.surface, textColor: C.amber, fontStyle: "bold", fontSize: 8 },
    columnStyles: { 2: { textColor: C.green } },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Upcoming vaccines ─────────────────────────────────────────
  if (stats.upcomingVaccines?.length > 0) {
    if (y > 230) { doc.addPage(); pageHeader(doc, "Monthly Farm Report", `${month} — continued`); y = 38; }
    y = sectionBar(doc, "UPCOMING VACCINES (next 30 days)", y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [["Tag ID", "Name", "Vaccine", "Last Given", "Next Due", "Days Left"]],
      body: stats.upcomingVaccines.map((v) => {
        const days = Math.ceil((new Date(v.nextDue) - new Date()) / 864e5);
        return [v.cattleTag, safe(v.cattleName), safe(v.name), v.date, v.nextDue, `${days} days`];
      }),
      columnStyles: {
        0: { textColor: C.amber, fontStyle: "bold" },
        5: { textColor: C.red },
      },
    });
  }

  addFooters(doc);
  doc.save(`farm-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ════════════════════════════════════════════════════════════════════
// REPORT 2: Shareholder Summary (read-only, no sensitive details)
// ════════════════════════════════════════════════════════════════════
export function generateShareholderReport({ stats, milkLogs, incomes }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const month = new Date().toLocaleDateString("en-BD", { month: "long", year: "numeric" });

  pageHeader(doc, "Shareholder Summary Report", `Period: ${month}`);

  let y = 38;
  y = sectionBar(doc, "FINANCIAL SUMMARY", y);

  const milkRev = milkLogs.reduce((s, l) => s + l.sold * l.pricePerLiter, 0);
  kpiBox(doc, "Total Income",   bdt(stats.monthlyIncome),  14,  y, C.green);
  kpiBox(doc, "Total Expense",  bdt(stats.monthlyExpense), 61,  y, C.red);
  kpiBox(doc, "Net Profit",     bdt(stats.netProfit),      108, y, stats.netProfit >= 0 ? C.green : C.red);
  kpiBox(doc, "Milk Revenue",   bdt(milkRev),              155, y, C.sky);
  y += 24;

  y = sectionBar(doc, "FARM STATUS", y);
  kpiBox(doc, "Total Cattle", stats.totalCattle,    14,  y, C.amber);
  kpiBox(doc, "Healthy",      stats.healthyCattle,  61,  y, C.green);
  kpiBox(doc, "Sick",         stats.sickCattle,     108, y, C.red);
  kpiBox(doc, "For Sale",     stats.forSaleCattle,  155, y, C.amber);
  y += 26;

  y = sectionBar(doc, "INCOME DETAILS", y);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Date", "Source", "Amount (BDT)", "Description"]],
    body: incomes.map((i) => [i.date, safe(i.source), bdt(i.amount), safe(i.description)]),
    foot: [["", "TOTAL", bdt(stats.monthlyIncome), ""]],
    footStyles: { fillColor: C.surface, textColor: C.amber, fontStyle: "bold", fontSize: 8 },
    columnStyles: { 2: { textColor: C.green } },
  });

  addFooters(doc);
  doc.save(`shareholder-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ════════════════════════════════════════════════════════════════════
// REPORT 3: Individual Cattle Profile
// ════════════════════════════════════════════════════════════════════
export function generateCattleReport(cattle) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  pageHeader(
    doc,
    `Cattle Profile: ${cattle.tagId}`,
    `${safe(cattle.name)}  |  ${safe(cattle.breed)}  |  ${cattle.type === "dairy" ? "Dairy" : "Fattening"}`
  );

  let y = 38;
  y = sectionBar(doc, "BASIC INFORMATION", y);

  kpiBox(doc, "Tag ID",       cattle.tagId,                  14,  y, C.amber);
  kpiBox(doc, "Age",          `${cattle.age} years`,         61,  y, C.sky);
  kpiBox(doc, "Buy Price",    bdt(cattle.purchasePrice),      108, y, C.green);
  kpiBox(doc, "Status",
    cattle.status === "healthy" ? "Healthy" : cattle.status === "sick" ? "Sick" : "For Sale",
    155, y,
    cattle.status === "healthy" ? C.green : cattle.status === "sick" ? C.red : C.amber
  );
  y += 26;

  // Purchase date + type info
  doc.setFillColor(...C.surface);
  doc.roundedRect(14, y, 182, 10, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(`Purchase Date: ${cattle.purchaseDate || "-"}`, 18, y + 6.5);
  doc.text(`Type: ${cattle.type === "dairy" ? "Dairy" : "Fattening"}`, 80, y + 6.5);
  if (cattle.notes) {
    const noteText = safe(cattle.notes);
    doc.text(`Note: ${noteText.slice(0, 60)}${noteText.length > 60 ? "..." : ""}`, 120, y + 6.5);
  }
  y += 18;

  // Weight history
  if (cattle.weight?.length > 0) {
    y = sectionBar(doc, "WEIGHT HISTORY", y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [["Date", "Weight (kg)", "Change (kg)", "Cumulative Gain"]],
      body: cattle.weight.map((w, i) => {
        const prev   = cattle.weight[i - 1];
        const change = prev ? `+${(w.value - prev.value).toFixed(1)}` : "—";
        const total  = `+${(w.value - cattle.weight[0].value).toFixed(1)}`;
        return [w.date, `${w.value} kg`, change, i > 0 ? total : "—"];
      }),
      columnStyles: {
        1: { textColor: C.amber, fontStyle: "bold" },
        2: { textColor: C.green },
        3: { textColor: C.sky },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Vaccine history
  if (cattle.vaccineHistory?.length > 0) {
    if (y > 230) { doc.addPage(); pageHeader(doc, `Cattle Profile: ${cattle.tagId}`, "continued"); y = 38; }
    y = sectionBar(doc, "VACCINE HISTORY", y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [["Vaccine Name", "Date Given", "Next Due Date", "Days Until Due"]],
      body: cattle.vaccineHistory.map((v) => {
        const days = Math.ceil((new Date(v.nextDue) - new Date()) / 864e5);
        return [
          safe(v.name),
          v.date,
          v.nextDue,
          days > 0 ? `${days} days` : "OVERDUE",
        ];
      }),
      columnStyles: {
        3: { textColor: C.red },
      },
    });
  }

  addFooters(doc);
  doc.save(`cattle-${cattle.tagId}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
