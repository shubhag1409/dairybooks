import { useState } from "react";
import ExcelJS from "exceljs";
import { Download, Mail } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { currentMonth, inr, monthBounds, throwApiError , safeErrorToast } from "@/lib/dairy";

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [busy, setBusy] = useState(false);

  const buildWorkbook = async () => {
    const { start, end } = monthBounds(month);
    const [settings, purchases, purchaseItems, sales, saleItems, crates] = await Promise.all([
      supabase.from("business_settings").select("business_name,ca_email").maybeSingle(),
      supabase.from("purchases").select("id,date,invoice_path").gte("date", start).lt("date", end).order("date"),
      supabase.from("purchase_items").select("purchase_id,quantity,price,products(name,unit)") ,
      supabase.from("sales").select("id,date,customers(name)").gte("date", start).lt("date", end).order("date"),
      supabase.from("sale_items").select("sale_id,quantity,amount,products(name,unit)"),
      supabase.from("crates").select("date,opening_stock,received,given,closing_stock").gte("date", start).lt("date", end).order("date"),
    ]);
    const error = settings.error || purchases.error || purchaseItems.error || sales.error || saleItems.error || crates.error;
    throwApiError(error, "Could not load report data");

    const wb = new ExcelJS.Workbook();
    wb.creator = "DairyBook";
    const title = settings.data?.business_name || "DairyBook";
    const addSheet = (name: string, cols: { header: string; key: string; width?: number }[]) => {
      const ws = wb.addWorksheet(name);
      ws.columns = cols;
      ws.spliceRows(1, 0, [`${title} · ${name} · ${month}`]);
      ws.mergeCells(1, 1, 1, cols.length);
      ws.getCell(1, 1).font = { bold: true, size: 14 };
      ws.getRow(2).font = { bold: true };
      return ws;
    };
    const pws = addSheet("Purchases", [{ header: "Date", key: "date", width: 14 }, { header: "Product", key: "product", width: 28 }, { header: "Qty", key: "qty", width: 12 }, { header: "Unit", key: "unit", width: 12 }, { header: "Amount", key: "amount", width: 14 }]);
    (purchaseItems.data ?? []).forEach((item: any) => { const p = (purchases.data ?? []).find((x: any) => x.id === item.purchase_id); if (p) pws.addRow({ date: p.date, product: item.products?.name, qty: Number(item.quantity), unit: item.products?.unit, amount: Number(item.price) }); });
    const sws = addSheet("Sales", [{ header: "Date", key: "date", width: 14 }, { header: "Customer", key: "customer", width: 26 }, { header: "Product", key: "product", width: 28 }, { header: "Qty", key: "qty", width: 12 }, { header: "Amount", key: "amount", width: 14 }]);
    (saleItems.data ?? []).forEach((item: any) => { const s = (sales.data ?? []).find((x: any) => x.id === item.sale_id); if (s) sws.addRow({ date: s.date, customer: s.customers?.name, product: item.products?.name, qty: Number(item.quantity), amount: Number(item.amount) }); });
    const cws = addSheet("Crates", [{ header: "Date", key: "date", width: 14 }, { header: "Opening", key: "opening_stock", width: 12 }, { header: "Received", key: "received", width: 12 }, { header: "Given", key: "given", width: 12 }, { header: "Closing", key: "closing_stock", width: 12 }]);
    (crates.data ?? []).forEach((row: any) => cws.addRow(row));
    const summary = wb.addWorksheet("Summary");
    const purchaseTotal = (purchaseItems.data ?? []).reduce((s: number, x: any) => s + Number(x.price || 0), 0);
    const salesTotal = (saleItems.data ?? []).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
    summary.addRows([[title], [month], [], ["Purchase total", inr(purchaseTotal)], ["Sales total", inr(salesTotal)], ["Net", inr(salesTotal - purchaseTotal)]]);
    summary.getColumn(1).width = 22;
    summary.getColumn(2).width = 18;
    return wb;
  };

  const download = async () => {
    setBusy(true);
    try {
      const wb = await buildWorkbook();
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DairyBook-${month}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (err: any) { safeErrorToast(err, "Could not create report"); } finally { setBusy(false); }
  };

  return <><PageHeader title="Reports & Export" subtitle="Download a monthly Excel workbook for your CA." /><section className="bg-card border border-border rounded-lg shadow-card p-6 max-w-2xl"><div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end"><label className="text-xs font-medium text-ink-2">Report month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input mt-1.5" /></label><button onClick={download} disabled={busy} className="h-10 px-5 rounded-md bg-forest text-cream text-sm font-medium hover:bg-forest-l press disabled:opacity-60 inline-flex items-center justify-center gap-2"><Download className="h-4 w-4" />{busy ? "Preparing…" : "Download Excel"}</button><button disabled className="h-10 px-5 rounded-md border border-border text-ink-3 text-sm inline-flex items-center justify-center gap-2 cursor-not-allowed"><Mail className="h-4 w-4" />Email CA</button></div><p className="text-sm text-ink-3 mt-5">Email sending needs an email domain setup first. Download works now.</p></section><style>{inputCss}</style></>;
}
const inputCss = `.input{width:100%;height:2.5rem;padding:0 .875rem;border-radius:.5rem;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--ink));font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--turmeric));box-shadow:0 0 0 3px hsl(var(--turmeric)/.18)}`;
