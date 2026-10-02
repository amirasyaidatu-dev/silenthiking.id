import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Upload, Copy, Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";
import { idr } from "@/lib/format";
import api, { apiError } from "@/lib/api";

export default function ApparelDetail() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ full_name: "", whatsapp_number: "", email: "", address: "", payment_proof: null });

  useEffect(() => {
    api.get(`/apparel/${slug}`).then((r) => {
      setP(r.data); setActive(r.data.image_url);
      if (r.data.sizes?.length) setSize(r.data.sizes[0]);
      if (r.data.colors?.length) setColor(r.data.colors[0].name);
    }).catch(() => toast.error("Produk tidak ditemukan"));
  }, [slug]);

  if (!p) return <div className="min-h-screen bg-bone"><Navbar /><div className="pt-40 text-center text-charcoal/50">Memuat…</div></div>;

  const gallery = [p.image_url, ...(p.gallery_urls || [])];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error("Maks 3MB");
    const r = new FileReader(); r.onload = () => set("payment_proof", r.result); r.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.full_name || !form.whatsapp_number) return toast.error("Lengkapi nama & WhatsApp");
    try {
      const { data } = await api.post("/apparel-orders", {
        apparel_id: p.id, size, color, quantity: qty, ...form,
      });
      setOrder(data);
      toast.success("Pesanan dibuat!");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <button onClick={() => nav("/shop")} className="text-charcoal/60 text-sm flex items-center gap-2 mb-8 hover:text-forest"><ArrowLeft size={16} /> Shop</button>
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] mb-4 bg-bone-dark">
              <img src={active} alt={p.name} className="w-full h-full object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3">
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActive(g)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${active === g ? "border-forest" : "border-transparent"}`}>
                    <img src={g} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="overline text-forest mb-3">{p.category}</p>
            <h1 className="font-serif text-4xl text-charcoal mb-3">{p.name}</h1>
            <p className="text-2xl text-forest mb-6">{idr(p.price)}</p>
            <p className="text-charcoal/65 leading-relaxed mb-8">{p.description}</p>

            {p.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-charcoal mb-2">Color: <span className="text-charcoal/60">{color}</span></p>
                <div className="flex gap-2">
                  {p.colors.map((c) => (
                    <button key={c.name} data-testid={`color-${c.name}`} onClick={() => setColor(c.name)} title={c.name}
                      className={`w-9 h-9 rounded-full border-2 ${color === c.name ? "border-forest" : "border-sh-border"}`} style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>
            )}

            {p.sizes?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-charcoal mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((s) => (
                    <button key={s} data-testid={`apparel-size-${s}`} onClick={() => setSize(s)}
                      className={`min-w-[44px] h-11 px-3 rounded-lg border text-sm ${size === s ? "bg-forest text-bone border-forest" : "border-sh-border text-charcoal/70 hover:border-moss"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-sm font-medium text-charcoal mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-full border border-sh-border flex items-center justify-center"><Minus size={15} /></button>
                <span data-testid="apparel-qty" className="font-medium w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-full border border-sh-border flex items-center justify-center"><Plus size={15} /></button>
              </div>
            </div>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setOrder(null); }}>
              <DialogTrigger asChild>
                <button data-testid="buy-now" className="w-full py-4 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors">Buy Now — {idr(p.price * qty)}</button>
              </DialogTrigger>
              <DialogContent className="bg-bone max-w-md">
                {!order ? (
                  <>
                    <DialogHeader><DialogTitle className="font-serif text-2xl">Checkout — {p.name}</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                      <p className="text-sm text-charcoal/60">{size} · {color} · Qty {qty} · <span className="text-forest font-medium">{idr(p.price * qty)}</span></p>
                      <input data-testid="order-name" placeholder="Nama Lengkap" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm" />
                      <input data-testid="order-wa" placeholder="No. WhatsApp" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm" />
                      <input data-testid="order-email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm" />
                      <textarea data-testid="order-address" placeholder="Alamat Pengiriman" value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm" rows={2} />
                      <div className="bg-forest/5 rounded-xl p-3 text-sm">
                        <p className="font-medium text-charcoal mb-1">Transfer ke:</p>
                        <p className="text-charcoal/70">{settings.bank_name} · <span className="font-mono">{settings.account_number}</span> · a.n. {settings.account_holder}</p>
                        <button onClick={() => { navigator.clipboard.writeText(settings.account_number || ""); toast.success("Disalin"); }} className="mt-1 text-xs text-forest flex items-center gap-1"><Copy size={12} /> Salin</button>
                      </div>
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-sh-border cursor-pointer text-sm text-charcoal/60">
                        <Upload size={15} /> {form.payment_proof ? "Bukti terunggah ✓" : "Upload bukti transfer"}
                        <input type="file" accept="image/*" data-testid="order-proof" onChange={onFile} className="hidden" />
                      </label>
                      <button data-testid="order-submit" onClick={submit} className="w-full py-3 rounded-full bg-forest text-bone font-medium">Konfirmasi Pesanan</button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-3" data-testid="order-success">
                    <div className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto"><Check className="text-moss" /></div>
                    <h3 className="font-serif text-2xl text-charcoal">Pesanan Dibuat!</h3>
                    <p className="font-mono text-forest" data-testid="order-code">{order.order_code}</p>
                    <p className="text-xs text-charcoal/50">Admin akan memverifikasi pembayaran. Simpan kode pesanan ini.</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="mt-6 text-sm text-charcoal/55 space-y-1">
              {p.material && <p>Material: {p.material}</p>}
              {p.fit && <p>Fit: {p.fit}</p>}
              <p>Free shipping for orders above {idr(500000)}</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
