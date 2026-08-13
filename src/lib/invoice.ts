type InvoiceOrder = {
  order_number: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note?: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
};

type InvoiceItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export const printInvoice = (order: InvoiceOrder, items: InvoiceItem[]) => {
  const rows = items
    .map(
      (it, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(it.product_name)}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">${Number(it.unit_price).toFixed(2)} ₾</td>
        <td class="r">${(it.quantity * Number(it.unit_price)).toFixed(2)} ₾</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="ka"><head><meta charset="utf-8" />
<title>ინვოისი #${esc(order.order_number)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans Georgian", system-ui, sans-serif; color: #2b2320; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #8a7f79; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e6ddd5; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 20px; font-weight: 700; color: #c2703c; }
  .grid { display: flex; gap: 24px; margin-bottom: 18px; }
  .box { flex: 1; background: #faf6f2; border: 1px solid #eee3d9; border-radius: 10px; padding: 12px; font-size: 13px; }
  .box b { display: block; margin-bottom: 6px; font-size: 12px; color: #8a7f79; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #eee3d9; text-align: left; }
  th { background: #faf6f2; font-size: 12px; }
  .c { text-align: center; } .r { text-align: right; }
  .totals { margin-left: auto; width: 260px; margin-top: 14px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .sum { border-top: 2px solid #e6ddd5; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #c2703c; }
  footer { margin-top: 28px; font-size: 11px; color: #8a7f79; text-align: center; }
</style></head>
<body>
  <div class="head">
    <div><div class="brand">Achuqe</div><div class="muted">achuqe.com · ხელნაკეთი ნივთები</div></div>
    <div style="text-align:right"><h1>ინვოისი</h1>
      <div class="muted">#${esc(order.order_number)}</div>
      <div class="muted">${new Date(order.created_at).toLocaleString("ka-GE")}</div>
    </div>
  </div>
  <div class="grid">
    <div class="box"><b>მყიდველი</b>
      ${esc(order.first_name)} ${esc(order.last_name)}<br/>
      ${esc(order.phone)}<br/>${esc(order.email)}
    </div>
    <div class="box"><b>მიწოდება</b>
      ${esc(order.city)}, ${esc(order.address)}<br/>
      გადახდა: ${esc(order.payment_method)}
      ${order.note ? `<br/>შენიშვნა: ${esc(order.note)}` : ""}
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>დასახელება</th><th class="c">რაოდ.</th><th class="r">ფასი</th><th class="r">ჯამი</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>ქვეჯამი</span><span>${Number(order.subtotal).toFixed(2)} ₾</span></div>
    <div><span>მიწოდება</span><span>${Number(order.shipping_fee).toFixed(2)} ₾</span></div>
    <div class="sum"><span>სულ</span><span>${Number(order.total).toFixed(2)} ₾</span></div>
  </div>
  <footer>გმადლობთ შენაძენისთვის! · achuqe.com</footer>
  <script>window.onload = () => { window.print(); };<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
};
