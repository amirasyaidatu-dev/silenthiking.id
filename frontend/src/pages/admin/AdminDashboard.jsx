import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard, Mountain, CalendarCheck, Shirt, ShoppingBag, BookOpen,
  Star, Settings as SettingsIcon, Users, Database, LogOut, Plus, Trash2,
  Pencil, Printer, Check, X, FileText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { idr, formatDate, formatDateShort } from "@/lib/format";
import api, { apiError } from "@/lib/api";

const money = (n) => idr(n);
const inputCls = "w-full p-2.5 rounded-lg border border-sh-border bg-white text-sm";
const labelCls = "text-xs text-charcoal/60 mb-1 block";

function StatusBadge({ status }) {
  const map = {
    APPROVED: "bg-moss/15 text-moss", PENDING: "bg-earth/15 text-earth", REJECTED: "bg-red-100 text-red-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || "bg-sh-border text-charcoal/60"}`}>{status}</span>;
}

/* ------------------------------- Panels ------------------------------- */
function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/overview").then((r) => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <p className="text-charcoal/50">Memuat…</p>;
  const cards = [
    { l: "Total Booking", v: s.total_bookings, c: "text-forest" },
    { l: "Menunggu Verifikasi", v: s.pending_bookings, c: "text-earth" },
    { l: "Booking Disetujui", v: s.approved_bookings, c: "text-moss" },
    { l: "Pendapatan Trip", v: money(s.trip_revenue), c: "text-forest" },
    { l: "Pesanan Apparel", v: s.apparel_orders, c: "text-forest" },
    { l: "Pendapatan Apparel", v: money(s.apparel_revenue), c: "text-moss" },
    { l: "Total Trip", v: s.total_trips, c: "text-charcoal" },
    { l: "Ulasan Pending", v: s.pending_reviews, c: "text-earth" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.l} className="bg-white border border-sh-border rounded-xl p-5" data-testid={`stat-${c.l}`}>
          <p className="text-xs text-charcoal/50 mb-2">{c.l}</p>
          <p className={`font-serif text-2xl ${c.c}`}>{c.v}</p>
        </div>
      ))}
    </div>
  );
}

const emptyTrip = {
  title: "", location: "", meeting_point: "", difficulty: "Easy", duration: "4 jam", min_age: 16,
  price: 0, description: "", image_url: "", wa_group_link: "", is_active: true,
  included: "", schedules: [{ event_date: "", quota: 15 }],
};

function Trips() {
  const [trips, setTrips] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyTrip);
  const [editId, setEditId] = useState(null);

  const load = useCallback(() => api.get("/trips").then((r) => setTrips(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyTrip); setEditId(null); setOpen(true); };
  const openEdit = (t) => {
    setForm({
      ...t, included: (t.included || []).join(", "),
      schedules: (t.schedules || []).map((s) => ({ event_date: s.event_date, quota: s.quota })),
    });
    setEditId(t.id); setOpen(true);
  };

  const save = async () => {
    const payload = {
      ...form, price: Number(form.price), min_age: Number(form.min_age),
      included: form.included.split(",").map((x) => x.trim()).filter(Boolean),
      timeline: form.timeline || [],
      gallery_urls: form.gallery_urls || [],
      schedules: form.schedules.filter((s) => s.event_date).map((s) => ({ event_date: s.event_date, quota: Number(s.quota) })),
    };
    try {
      if (editId) await api.put(`/admin/trips/${editId}`, payload);
      else await api.post("/admin/trips", payload);
      toast.success("Trip tersimpan"); setOpen(false); load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!window.confirm("Hapus trip ini?")) return; await api.delete(`/admin/trips/${id}`); toast.success("Dihapus"); load(); };

  const setSched = (i, k, v) => setForm((f) => { const sc = [...f.schedules]; sc[i] = { ...sc[i], [k]: v }; return { ...f, schedules: sc }; });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Kelola Trip</h2>
        <button data-testid="add-trip" onClick={openNew} className="px-4 py-2.5 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><Plus size={16} /> Trip Baru</button>
      </div>
      <div className="bg-white border border-sh-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone-dark text-charcoal/60 text-xs"><tr><th className="text-left p-4">Trip</th><th className="text-left p-4">Harga</th><th className="text-left p-4">Jadwal</th><th className="text-left p-4">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-t border-sh-border" data-testid={`trip-row-${t.slug}`}>
                <td className="p-4"><div className="flex items-center gap-3"><img src={t.image_url} alt="" className="w-10 h-10 rounded object-cover" /><div><p className="font-medium text-charcoal">{t.title}</p><p className="text-xs text-charcoal/50">{t.location}</p></div></div></td>
                <td className="p-4">{money(t.price)}</td>
                <td className="p-4">{t.schedules?.length || 0} tanggal</td>
                <td className="p-4">{t.is_active ? <span className="text-moss text-xs">Aktif</span> : <span className="text-charcoal/40 text-xs">Nonaktif</span>}</td>
                <td className="p-4 text-right"><button onClick={() => openEdit(t)} className="p-2 text-charcoal/50 hover:text-forest" data-testid={`edit-trip-${t.slug}`}><Pencil size={15} /></button><button onClick={() => del(t.id)} className="p-2 text-charcoal/50 hover:text-red-600"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-bone max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit" : "Buat"} Trip</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={labelCls}>Judul</label><input data-testid="trip-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className={labelCls}>Lokasi</label><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className={labelCls}>Meeting Point</label><input className={inputCls} value={form.meeting_point || ""} onChange={(e) => setForm({ ...form, meeting_point: e.target.value })} /></div>
            <div><label className={labelCls}>Difficulty</label><select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Moderate</option><option>Private</option></select></div>
            <div><label className={labelCls}>Durasi</label><input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div><label className={labelCls}>Harga (Rp)</label><input type="number" data-testid="trip-price" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className={labelCls}>Min. Usia</label><input type="number" className={inputCls} value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Image URL</label><input className={inputCls} value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Link Grup WA</label><input className={inputCls} value={form.wa_group_link || ""} onChange={(e) => setForm({ ...form, wa_group_link: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Deskripsi</label><textarea className={inputCls} rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Termasuk (pisah koma)</label><input className={inputCls} value={form.included} onChange={(e) => setForm({ ...form, included: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Jadwal (maks 15 kuota / jadwal)</label>
              {form.schedules.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="date" className={inputCls} value={s.event_date} onChange={(e) => setSched(i, "event_date", e.target.value)} data-testid={`sched-date-${i}`} />
                  <input type="number" max={15} className="w-24 p-2.5 rounded-lg border border-sh-border bg-white text-sm" value={s.quota} onChange={(e) => setSched(i, "quota", e.target.value)} />
                  <button onClick={() => setForm((f) => ({ ...f, schedules: f.schedules.filter((_, j) => j !== i) }))} className="p-2 text-red-500"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => setForm((f) => ({ ...f, schedules: [...f.schedules, { event_date: "", quota: 15 }] }))} className="text-xs text-forest">+ Tambah jadwal</button>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Aktif</label>
          </div>
          <DialogFooter><button data-testid="save-trip" onClick={save} className="px-6 py-2.5 rounded-full bg-forest text-bone text-sm">Simpan</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Bookings() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [edit, setEdit] = useState(null);
  const nav = useNavigate();
  const load = useCallback(() => api.get(`/admin/bookings?status=${filter}`).then((r) => setRows(r.data)).catch(() => {}), [filter]);
  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    try {
      await api.put(`/admin/bookings/${edit.id}`, {
        full_name: edit.full_name, whatsapp_number: edit.whatsapp_number,
        emergency_contact: edit.emergency_contact, shirt_size: edit.shirt_size,
        drink_bonus: edit.drink_bonus, participants: Number(edit.participants), payment_status: edit.payment_status,
      });
      toast.success("Booking diperbarui"); setEdit(null); load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  const setStatus = async (id, status) => { await api.put(`/admin/bookings/${id}`, { payment_status: status }); toast.success(`Status: ${status}`); load(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="font-serif text-2xl text-charcoal">Manajemen Booking</h2>
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button key={s} data-testid={`booking-filter-${s}`} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs ${filter === s ? "bg-forest text-bone" : "bg-white border border-sh-border text-charcoal/60"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-sh-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-bone-dark text-charcoal/60 text-xs"><tr><th className="text-left p-3">Kode</th><th className="text-left p-3">Peserta</th><th className="text-left p-3">Trip</th><th className="text-left p-3">Kaos/Minuman</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-sh-border" data-testid={`booking-row-${b.booking_code}`}>
                <td className="p-3 font-mono text-xs">{b.booking_code}</td>
                <td className="p-3"><p className="font-medium">{b.full_name}</p><p className="text-xs text-charcoal/50">{b.whatsapp_number}</p></td>
                <td className="p-3">{b.trip?.title}<br /><span className="text-xs text-charcoal/50">{b.schedule ? formatDateShort(b.schedule.event_date) : ""}</span></td>
                <td className="p-3 text-xs">{b.shirt_size} · <span className="capitalize">{b.drink_bonus}</span></td>
                <td className="p-3">{money(b.total_amount)}</td>
                <td className="p-3"><StatusBadge status={b.payment_status} /></td>
                <td className="p-3">
                  <div className="flex items-center gap-1 justify-end">
                    {b.payment_status !== "APPROVED" && <button title="Approve" onClick={() => setStatus(b.id, "APPROVED")} className="p-1.5 text-moss" data-testid={`approve-${b.booking_code}`}><Check size={15} /></button>}
                    {b.payment_status !== "REJECTED" && <button title="Reject" onClick={() => setStatus(b.id, "REJECTED")} className="p-1.5 text-red-500"><X size={15} /></button>}
                    <button title="Edit" onClick={() => setEdit(b)} className="p-1.5 text-charcoal/50 hover:text-forest"><Pencil size={15} /></button>
                    <button title="Invoice" onClick={() => nav(`/booking/${b.booking_code}`)} className="p-1.5 text-charcoal/50 hover:text-forest"><Printer size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="bg-bone max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-xl">Edit Booking</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><label className={labelCls}>Nama</label><input className={inputCls} value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></div>
              <div><label className={labelCls}>WhatsApp</label><input className={inputCls} value={edit.whatsapp_number} onChange={(e) => setEdit({ ...edit, whatsapp_number: e.target.value })} /></div>
              <div><label className={labelCls}>Kontak Darurat</label><input className={inputCls} value={edit.emergency_contact || ""} onChange={(e) => setEdit({ ...edit, emergency_contact: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Ukuran Kaos</label><input className={inputCls} value={edit.shirt_size} onChange={(e) => setEdit({ ...edit, shirt_size: e.target.value })} /></div>
                <div><label className={labelCls}>Minuman</label><select className={inputCls} value={edit.drink_bonus} onChange={(e) => setEdit({ ...edit, drink_bonus: e.target.value })}><option value="kopi">kopi</option><option value="cokelat">cokelat</option></select></div>
              </div>
              <div><label className={labelCls}>Status Pembayaran</label><select data-testid="edit-booking-status" className={inputCls} value={edit.payment_status} onChange={(e) => setEdit({ ...edit, payment_status: e.target.value })}><option>PENDING</option><option>APPROVED</option><option>REJECTED</option></select></div>
              {edit.payment_proof && <img src={edit.payment_proof} alt="bukti" className="rounded-lg max-h-40 object-contain border border-sh-border" />}
            </div>
          )}
          <DialogFooter><button data-testid="save-booking" onClick={saveEdit} className="px-6 py-2.5 rounded-full bg-forest text-bone text-sm">Simpan</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const emptyApparel = { name: "", category: "Apparel", price: 0, image_url: "", gallery_urls: "", sizes: "XS,S,M,L,XL,XXL", colors: "Forest Green:#2D4A3E", material: "", fit: "", stock: 10, description: "", is_active: true };

function ApparelCatalog() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyApparel);
  const [editId, setEditId] = useState(null);
  const load = useCallback(() => api.get("/apparel").then((r) => setItems(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const openEdit = (a) => {
    setForm({ ...a, gallery_urls: (a.gallery_urls || []).join(", "), sizes: (a.sizes || []).join(","), colors: (a.colors || []).map((c) => `${c.name}:${c.hex}`).join(", ") });
    setEditId(a.id); setOpen(true);
  };
  const save = async () => {
    const payload = {
      name: form.name, category: form.category, price: Number(form.price), image_url: form.image_url,
      gallery_urls: form.gallery_urls.split(",").map((x) => x.trim()).filter(Boolean),
      sizes: form.sizes.split(",").map((x) => x.trim()).filter(Boolean),
      colors: form.colors.split(",").map((x) => x.trim()).filter(Boolean).map((c) => { const [name, hex] = c.split(":"); return { name: name?.trim(), hex: (hex || "#2D4A3E").trim() }; }),
      material: form.material, fit: form.fit, stock: Number(form.stock), description: form.description, is_active: form.is_active,
    };
    try {
      if (editId) await api.put(`/admin/apparel/${editId}`, payload); else await api.post("/admin/apparel", payload);
      toast.success("Produk tersimpan"); setOpen(false); load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!window.confirm("Hapus produk?")) return; await api.delete(`/admin/apparel/${id}`); toast.success("Dihapus"); load(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Katalog Apparel</h2>
        <button data-testid="add-apparel" onClick={() => { setForm(emptyApparel); setEditId(null); setOpen(true); }} className="px-4 py-2.5 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><Plus size={16} /> Produk Baru</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {items.map((a) => (
          <div key={a.id} className="bg-white border border-sh-border rounded-xl overflow-hidden" data-testid={`apparel-card-${a.slug}`}>
            <img src={a.image_url} alt="" className="w-full aspect-square object-cover" />
            <div className="p-3">
              <p className="text-xs text-charcoal/50">{a.category}</p>
              <p className="font-medium text-sm text-charcoal truncate">{a.name}</p>
              <p className="text-sm text-forest">{money(a.price)}</p>
              <p className="text-xs text-charcoal/40">Stok: {a.stock}</p>
              <div className="flex gap-1 mt-2">
                <button onClick={() => openEdit(a)} className="flex-1 py-1.5 rounded-lg border border-sh-border text-xs flex items-center justify-center gap-1"><Pencil size={12} /> Edit</button>
                <button onClick={() => del(a.id)} className="py-1.5 px-2 rounded-lg border border-sh-border text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-bone max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit" : "Buat"} Produk</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={labelCls}>Nama</label><input data-testid="apparel-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={labelCls}>Kategori</label><select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Apparel</option><option>Accessories</option><option>Merchandise</option><option>Limited Edition</option></select></div>
            <div><label className={labelCls}>Harga</label><input type="number" data-testid="apparel-price" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className={labelCls}>Stok</label><input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div><label className={labelCls}>Material</label><input className={inputCls} value={form.material || ""} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Image URL</label><input className={inputCls} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Galeri (URL pisah koma)</label><input className={inputCls} value={form.gallery_urls} onChange={(e) => setForm({ ...form, gallery_urls: e.target.value })} /></div>
            <div><label className={labelCls}>Ukuran (pisah koma)</label><input className={inputCls} value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></div>
            <div><label className={labelCls}>Warna (nama:hex, koma)</label><input className={inputCls} value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Deskripsi</label><textarea className={inputCls} rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><button data-testid="save-apparel" onClick={save} className="px-6 py-2.5 rounded-full bg-forest text-bone text-sm">Simpan</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApparelOrders() {
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const load = useCallback(() => api.get("/admin/apparel-orders").then((r) => setOrders(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id, status) => { await api.put(`/admin/apparel-orders/${id}`, { payment_status: status }); toast.success(status); load(); };
  const loadReport = async () => { const { data } = await api.get("/admin/reports/apparel"); setReport(data); };
  const printReport = () => { window.print(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="font-serif text-2xl text-charcoal">Pesanan Apparel</h2>
        <button data-testid="load-report" onClick={loadReport} className="px-4 py-2.5 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><FileText size={16} /> Buat Laporan</button>
      </div>

      <div className="bg-white border border-sh-border rounded-xl overflow-x-auto mb-8 no-print">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-bone-dark text-charcoal/60 text-xs"><tr><th className="text-left p-3">Kode</th><th className="text-left p-3">Pelanggan</th><th className="text-left p-3">Produk</th><th className="text-left p-3">Ukuran/Qty</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-sh-border" data-testid={`order-row-${o.order_code}`}>
                <td className="p-3 font-mono text-xs">{o.order_code}</td>
                <td className="p-3">{o.full_name}<br /><span className="text-xs text-charcoal/50">{o.whatsapp_number}</span></td>
                <td className="p-3">{o.product_name}</td>
                <td className="p-3">{o.size || "-"} · {o.quantity}x</td>
                <td className="p-3">{money(o.total_amount)}</td>
                <td className="p-3"><StatusBadge status={o.payment_status} /></td>
                <td className="p-3 text-right">
                  {o.payment_status !== "APPROVED" && <button onClick={() => setStatus(o.id, "APPROVED")} className="p-1.5 text-moss"><Check size={15} /></button>}
                  {o.payment_status !== "REJECTED" && <button onClick={() => setStatus(o.id, "REJECTED")} className="p-1.5 text-red-500"><X size={15} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="bg-white border border-sh-border rounded-xl p-6" id="apparel-report" data-testid="apparel-report">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif text-xl text-charcoal">Laporan Pesanan Apparel</h3>
            <button onClick={printReport} className="px-4 py-2 rounded-full bg-forest text-bone text-sm flex items-center gap-2 no-print"><Printer size={15} /> Cetak</button>
          </div>
          <p className="text-xs text-charcoal/50 mb-4">Digenerate: {formatDate(report.generated_at)}</p>
          <table className="w-full text-sm">
            <thead className="bg-bone-dark text-charcoal/60 text-xs"><tr><th className="text-left p-2">Produk</th><th className="text-left p-2">Ukuran</th><th className="text-left p-2">Qty</th><th className="text-left p-2">Pesanan</th><th className="text-left p-2">Pendapatan</th></tr></thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i} className="border-t border-sh-border"><td className="p-2">{r.product_name}</td><td className="p-2">{r.size}</td><td className="p-2">{r.quantity}</td><td className="p-2">{r.orders}</td><td className="p-2">{money(r.revenue)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-sh-border font-semibold"><td className="p-2" colSpan={2}>Total</td><td className="p-2">{report.total_quantity}</td><td className="p-2">{report.total_orders}</td><td className="p-2 text-forest">{money(report.total_revenue)}</td></tr></tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

const emptyBlog = { title: "", category: "Mindfulness", read_time: "5 min read", image_url: "", excerpt: "", content: "", is_published: true };

function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyBlog);
  const [editId, setEditId] = useState(null);
  const load = useCallback(() => api.get("/blogs").then((r) => setBlogs(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const openEdit = async (b) => { const { data } = await api.get(`/blogs/${b.slug}`); setForm(data); setEditId(b.id); setOpen(true); };
  const save = async () => {
    const payload = { title: form.title, category: form.category, read_time: form.read_time, image_url: form.image_url, excerpt: form.excerpt, content: form.content, is_published: form.is_published };
    try { if (editId) await api.put(`/admin/blogs/${editId}`, payload); else await api.post("/admin/blogs", payload); toast.success("Artikel tersimpan"); setOpen(false); load(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!window.confirm("Hapus artikel?")) return; await api.delete(`/admin/blogs/${id}`); toast.success("Dihapus"); load(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Blog / Journal</h2>
        <button data-testid="add-blog" onClick={() => { setForm(emptyBlog); setEditId(null); setOpen(true); }} className="px-4 py-2.5 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><Plus size={16} /> Artikel Baru</button>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {blogs.map((b) => (
          <div key={b.id} className="bg-white border border-sh-border rounded-xl overflow-hidden" data-testid={`blog-card-${b.slug}`}>
            <img src={b.image_url} alt="" className="w-full aspect-[4/3] object-cover" />
            <div className="p-4">
              <p className="text-xs text-forest">{b.category} · {b.read_time}</p>
              <p className="font-serif text-lg text-charcoal mt-1 mb-3">{b.title}</p>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="flex-1 py-1.5 rounded-lg border border-sh-border text-xs flex items-center justify-center gap-1"><Pencil size={12} /> Edit</button>
                <button onClick={() => del(b.id)} className="py-1.5 px-2 rounded-lg border border-sh-border text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-bone max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit" : "Buat"} Artikel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className={labelCls}>Judul</label><input data-testid="blog-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Kategori</label><select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Mindfulness</option><option>Outdoor</option><option>Stories</option><option>Tips</option><option>Lifestyle</option></select></div>
              <div><label className={labelCls}>Waktu Baca</label><input className={inputCls} value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} /></div>
            </div>
            <div><label className={labelCls}>Image URL</label><input className={inputCls} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div><label className={labelCls}>Ringkasan</label><textarea className={inputCls} rows={2} value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div><label className={labelCls}>Konten</label><textarea data-testid="blog-content" className={inputCls} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Publikasikan</label>
          </div>
          <DialogFooter><button data-testid="save-blog" onClick={save} className="px-6 py-2.5 rounded-full bg-forest text-bone text-sm">Simpan</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Reviews() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/admin/reviews").then((r) => setRows(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const approve = async (id, v) => { await api.put(`/admin/reviews/${id}?is_approved=${v}`); toast.success(v ? "Disetujui" : "Disembunyikan"); load(); };
  const del = async (id) => { if (!window.confirm("Hapus ulasan?")) return; await api.delete(`/admin/reviews/${id}`); toast.success("Dihapus"); load(); };
  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal mb-6">Ulasan (terikat booking)</h2>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-charcoal/50">Belum ada ulasan.</p>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-sh-border rounded-xl p-5 flex justify-between items-start gap-4" data-testid={`review-${r.id}`}>
            <div>
              <div className="flex gap-1 mb-1">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} className="fill-earth text-earth" />)}</div>
              <p className="font-medium text-charcoal">{r.reviewer_name}</p>
              <p className="text-sm text-charcoal/60">{r.comment}</p>
              <span className={`text-xs ${r.is_approved ? "text-moss" : "text-earth"}`}>{r.is_approved ? "Tampil" : "Pending"}</span>
            </div>
            <div className="flex gap-1">
              {!r.is_approved ? <button onClick={() => approve(r.id, true)} className="p-2 text-moss" data-testid={`approve-review-${r.id}`}><Check size={16} /></button> : <button onClick={() => approve(r.id, false)} className="p-2 text-earth"><X size={16} /></button>}
              <button onClick={() => del(r.id)} className="p-2 text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <p className="text-charcoal/50">Memuat…</p>;
  const field = (k, label, type = "text") => (
    <div><label className={labelCls}>{label}</label><input type={type} data-testid={`setting-${k}`} className={inputCls} value={s[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>
  );
  const save = async () => { await api.put("/admin/settings", s); toast.success("Pengaturan tersimpan. Muat ulang untuk melihat perubahan brand."); };
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-2xl text-charcoal mb-6">Pengaturan</h2>
      <div className="space-y-6">
        <div className="bg-white border border-sh-border rounded-xl p-5 space-y-3">
          <p className="overline text-forest">Brand</p>
          {field("brand_name", "Nama Brand")}
          {field("brand_tagline", "Tagline")}
          {field("logo_url", "Logo URL")}
          {field("hero_image_url", "Hero Image URL")}
          <div className="grid grid-cols-2 gap-3">{field("primary_color", "Warna Utama")}{field("accent_color", "Warna Aksen")}</div>
        </div>
        <div className="bg-white border border-sh-border rounded-xl p-5 space-y-3">
          <p className="overline text-forest">Mode Pembayaran</p>
          <div><label className={labelCls}>Mode</label><select data-testid="setting-payment_mode" className={inputCls} value={s.payment_mode} onChange={(e) => setS({ ...s, payment_mode: e.target.value })}><option value="manual_transfer">Manual Transfer</option><option value="gateway">Payment Gateway</option><option value="both">Keduanya</option></select></div>
          {field("bank_name", "Nama Bank")}
          {field("account_number", "Nomor Rekening")}
          {field("account_holder", "Atas Nama")}
          {field("processing_fee", "Biaya Proses (Rp)", "number")}
        </div>
        <div className="bg-white border border-sh-border rounded-xl p-5 space-y-3">
          <p className="overline text-forest">Kontak</p>
          {field("contact_email", "Email")}
          {field("contact_whatsapp", "WhatsApp")}
          {field("contact_instagram", "Instagram")}
        </div>
        <button data-testid="save-settings" onClick={save} className="px-6 py-3 rounded-full bg-forest text-bone text-sm">Simpan Pengaturan</button>
      </div>
    </div>
  );
}

const emptyAdmin = { username: "", email: "", name: "", password: "", role: "admin" };
function Admins() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyAdmin);
  const load = useCallback(() => api.get("/admin/admins").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail))), []);
  useEffect(() => { load(); }, [load]);
  const save = async () => { try { await api.post("/admin/admins", form); toast.success("Admin dibuat"); setOpen(false); load(); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };
  const del = async (id) => { if (!window.confirm("Hapus admin?")) return; try { await api.delete(`/admin/admins/${id}`); toast.success("Dihapus"); load(); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Admin & Peran</h2>
        <button data-testid="add-admin" onClick={() => { setForm(emptyAdmin); setOpen(true); }} className="px-4 py-2.5 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><Plus size={16} /> Admin Baru</button>
      </div>
      <div className="bg-white border border-sh-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone-dark text-charcoal/60 text-xs"><tr><th className="text-left p-4">Username</th><th className="text-left p-4">Email</th><th className="text-left p-4">Peran</th><th className="p-4"></th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-sh-border" data-testid={`admin-row-${a.username}`}>
                <td className="p-4 font-medium">{a.name} <span className="text-charcoal/40">@{a.username}</span></td>
                <td className="p-4">{a.email}</td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs ${a.role === "superadmin" ? "bg-forest/15 text-forest" : "bg-sh-border text-charcoal/60"}`}>{a.role}</span></td>
                <td className="p-4 text-right"><button onClick={() => del(a.id)} className="p-2 text-red-500"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-bone max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-xl">Admin Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input data-testid="admin-name" placeholder="Nama" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input data-testid="admin-username" placeholder="Username" className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input data-testid="admin-email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input data-testid="admin-password" type="password" placeholder="Password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="admin">admin</option><option value="superadmin">superadmin</option></select>
          </div>
          <DialogFooter><button data-testid="save-admin" onClick={save} className="px-6 py-2.5 rounded-full bg-forest text-bone text-sm">Simpan</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DatabasePanel() {
  const [info, setInfo] = useState(null);
  useEffect(() => { api.get("/admin/db-info").then((r) => setInfo(r.data)).catch(() => {}); }, []);
  const exportData = async () => {
    const { data } = await api.get("/admin/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `silent-hiking-export-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success("Data diekspor");
  };
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-2xl text-charcoal mb-6">Database & Migrasi</h2>
      <div className="bg-white border border-sh-border rounded-xl p-5 mb-5">
        <p className="overline text-forest mb-3">Status</p>
        {info ? (
          <div className="space-y-1 text-sm text-charcoal/70">
            <p>Engine: <span className="font-medium text-charcoal">{info.engine}</span></p>
            <p>Versi: <span className="font-mono text-xs">{info.version}</span></p>
            <p>Revisi Alembic: <span className="font-mono text-xs">{info.alembic_revision}</span></p>
          </div>
        ) : <p className="text-charcoal/50 text-sm">Memuat…</p>}
      </div>
      <div className="bg-white border border-sh-border rounded-xl p-5">
        <p className="overline text-forest mb-2">Mekanisme Migrasi / Backup</p>
        <p className="text-sm text-charcoal/60 mb-4">Skema dikelola Alembic (versioned & reversible). Ekspor seluruh data sebagai JSON untuk backup atau migrasi ke PostgreSQL self-hosted di VPS Anda.</p>
        <button data-testid="export-data" onClick={exportData} className="px-6 py-3 rounded-full bg-forest text-bone text-sm flex items-center gap-2"><Database size={16} /> Export Semua Data (JSON)</button>
      </div>
    </div>
  );
}

/* ------------------------------- Shell ------------------------------- */
const tabs = [
  { k: "overview", label: "Overview", icon: LayoutDashboard, el: <Overview /> },
  { k: "trips", label: "Trip", icon: Mountain, el: <Trips /> },
  { k: "bookings", label: "Booking", icon: CalendarCheck, el: <Bookings /> },
  { k: "apparel", label: "Katalog Apparel", icon: Shirt, el: <ApparelCatalog /> },
  { k: "orders", label: "Pesanan & Laporan", icon: ShoppingBag, el: <ApparelOrders /> },
  { k: "blogs", label: "Blog / Journal", icon: BookOpen, el: <Blogs /> },
  { k: "reviews", label: "Ulasan", icon: Star, el: <Reviews /> },
  { k: "settings", label: "Pengaturan", icon: SettingsIcon, el: <SettingsPanel /> },
  { k: "admins", label: "Admin & Peran", icon: Users, el: <Admins />, super: true },
  { k: "database", label: "Database", icon: Database, el: <DatabasePanel /> },
];

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const nav = useNavigate();
  const [active, setActive] = useState("overview");
  const visible = tabs.filter((t) => !t.super || admin?.role === "superadmin");

  return (
    <div className="min-h-screen flex bg-bone">
      {/* Sidebar */}
      <aside className="w-60 bg-charcoal text-bone/80 flex flex-col fixed inset-y-0 no-print">
        <div className="p-6 border-b border-bone/10">
          <div className="flex items-center gap-2"><Mountain size={20} className="text-moss" strokeWidth={1.5} /><span className="font-serif text-bone">Silent Admin</span></div>
          <p className="text-xs text-bone/40 mt-1">{admin?.name} · {admin?.role}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visible.map((t) => (
            <button key={t.k} data-testid={`tab-${t.k}`} onClick={() => setActive(t.k)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${active === t.k ? "bg-forest text-bone" : "hover:bg-bone/5"}`}>
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-bone/10 space-y-1">
          <button onClick={() => nav("/")} className="w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-bone/5">↗ Lihat Situs</button>
          <button data-testid="logout" onClick={async () => { await logout(); nav("/admin/login"); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-bone/5 text-red-300"><LogOut size={16} /> Keluar</button>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-8 print:ml-0">
        {visible.find((t) => t.k === active)?.el}
      </main>
    </div>
  );
}
