import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Clock, Calendar, Users, Check, Minus, Plus, Upload, Coffee, ArrowLeft, Copy } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useSettings } from "@/context/SettingsContext";
import { idr, formatDate } from "@/lib/format";
import api, { apiError } from "@/lib/api";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const steps = ["Jadwal", "Data Diri", "Pembayaran", "Konfirmasi"];

export default function TripDetail() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [trip, setTrip] = useState(null);
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    schedule_id: "", participants: 1, full_name: "", whatsapp_number: "", email: "",
    emergency_contact: "", health_notes: "", shirt_size: "", drink_bonus: "", agreed_terms: false,
    payment_method: "manual_transfer", payment_proof: null,
  });

  useEffect(() => { api.get(`/trips/${slug}`).then((r) => setTrip(r.data)).catch(() => toast.error("Trip tidak ditemukan")); }, [slug]);

  if (!trip) return <div className="min-h-screen bg-bone"><Navbar /><div className="pt-40 text-center text-charcoal/50">Memuat…</div></div>;

  const sched = trip.schedules?.find((s) => s.id === form.schedule_id);
  const fee = Number(settings.processing_fee || 0);
  const total = trip.price * form.participants + fee;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error("Maks 3MB");
    const reader = new FileReader();
    reader.onload = () => set("payment_proof", reader.result);
    reader.readAsDataURL(file);
  };

  const next = () => {
    if (step === 0 && !form.schedule_id) return toast.error("Pilih jadwal dulu");
    if (step === 1) {
      if (!form.full_name || !form.whatsapp_number || !form.emergency_contact) return toast.error("Lengkapi data diri");
      if (!form.shirt_size) return toast.error("Pilih ukuran kaos (wajib)");
      if (!form.drink_bonus) return toast.error("Pilih bonus minuman (wajib)");
      if (!form.agreed_terms) return toast.error("Setujui syarat & ketentuan");
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", { trip_id: trip.id, ...form });
      setBooking(data);
      setStep(3);
      toast.success("Booking berhasil dibuat!");
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      {/* Hero */}
      <section className="relative h-[55vh] min-h-[420px] flex items-end">
        <img src={trip.image_url} alt={trip.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 to-charcoal/20" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full pb-12">
          <button onClick={() => nav("/experiences")} className="text-bone/70 text-sm flex items-center gap-2 mb-5 hover:text-bone"><ArrowLeft size={16} /> Semua Trip</button>
          <p className="overline text-moss mb-3">{trip.difficulty} Experience</p>
          <h1 className="font-serif text-4xl sm:text-6xl text-bone max-w-3xl">{trip.title}</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-16 grid lg:grid-cols-3 gap-12">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[{ icon: MapPin, l: "Location", v: trip.location }, { icon: Clock, l: "Duration", v: trip.duration }, { icon: Users, l: "Capacity", v: `${trip.total_slots_left} slot` }, { icon: Calendar, l: "Jadwal", v: `${trip.schedules?.length || 0} tanggal` }].map((x) => (
              <div key={x.l} className="bg-bone-alt border border-sh-border rounded-xl p-4">
                <x.icon size={18} className="text-forest mb-2" />
                <p className="text-xs text-charcoal/50">{x.l}</p>
                <p className="text-sm font-medium text-charcoal">{x.v}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-4">About</h2>
            <p className="text-charcoal/65 leading-relaxed whitespace-pre-line">{trip.description}</p>
          </div>

          {trip.included?.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-4">What's Included</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {trip.included.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 text-charcoal/70 text-sm">
                    <span className="w-6 h-6 rounded-full bg-moss/15 flex items-center justify-center"><Check size={13} className="text-moss" /></span>{it}
                  </div>
                ))}
              </div>
            </div>
          )}

          {trip.timeline?.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-5">Experience Timeline</h2>
              <div className="space-y-5 border-l-2 border-sh-border pl-6">
                {trip.timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-forest border-2 border-bone" />
                    <p className="font-mono text-sm text-forest">{t.time}</p>
                    <p className="font-medium text-charcoal">{t.title}</p>
                    <p className="text-sm text-charcoal/55">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: booking widget */}
        <div className="lg:col-span-1">
          <div id="booking" className="bg-bone-alt border border-sh-border rounded-2xl p-6 sticky top-28">
            <p className="font-serif text-3xl text-charcoal">{idr(trip.price)}</p>
            <p className="text-sm text-charcoal/50 mb-6">per person · includes all</p>

            {/* stepper */}
            <div className="flex items-center gap-1 mb-6">
              {steps.map((s, i) => (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${i <= step ? "bg-forest text-bone" : "bg-sh-border text-charcoal/50"}`}>{i + 1}</span>
                  {i < steps.length - 1 && <span className={`flex-1 h-0.5 ${i < step ? "bg-forest" : "bg-sh-border"}`} />}
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-3" data-testid="booking-step-schedule">
                <p className="text-sm font-medium text-charcoal">Pilih Jadwal</p>
                {trip.schedules?.length === 0 && <p className="text-sm text-charcoal/50">Jadwal belum tersedia.</p>}
                {trip.schedules?.map((s) => (
                  <button key={s.id} data-testid={`schedule-${s.id}`} disabled={s.slots_left === 0}
                    onClick={() => set("schedule_id", s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${form.schedule_id === s.id ? "border-forest bg-forest/5" : "border-sh-border hover:border-moss"} ${s.slots_left === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <p className="text-sm font-medium text-charcoal">{formatDate(s.event_date)}</p>
                    <p className={`text-xs ${s.slots_left <= 3 ? "text-earth" : "text-moss"}`}>{s.slots_left} / {s.quota} slot tersisa</p>
                  </button>
                ))}
                <button data-testid="booking-next-0" onClick={next} className="w-full mt-2 py-3 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors">Lanjut</button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3" data-testid="booking-step-info">
                <div>
                  <label className="text-xs text-charcoal/60">Jumlah Peserta</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => set("participants", Math.max(1, form.participants - 1))} className="w-9 h-9 rounded-full border border-sh-border flex items-center justify-center"><Minus size={15} /></button>
                    <span data-testid="participants-count" className="font-medium w-6 text-center">{form.participants}</span>
                    <button onClick={() => set("participants", Math.min(sched?.slots_left || 1, form.participants + 1))} className="w-9 h-9 rounded-full border border-sh-border flex items-center justify-center"><Plus size={15} /></button>
                  </div>
                </div>
                <input data-testid="input-fullname" placeholder="Nama Lengkap" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-bone text-sm" />
                <input data-testid="input-whatsapp" placeholder="No. WhatsApp (628xxx)" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-bone text-sm" />
                <input data-testid="input-email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-bone text-sm" />
                <input data-testid="input-emergency" placeholder="Kontak Darurat" value={form.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-bone text-sm" />
                <textarea data-testid="input-health" placeholder="Catatan kesehatan (opsional)" value={form.health_notes} onChange={(e) => set("health_notes", e.target.value)} className="w-full p-3 rounded-xl border border-sh-border bg-bone text-sm" rows={2} />

                <div>
                  <label className="text-xs text-charcoal/60">Ukuran Kaos (wajib)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SIZES.map((s) => (
                      <button key={s} data-testid={`size-${s}`} onClick={() => set("shirt_size", s)}
                        className={`w-10 h-10 rounded-lg text-sm border transition-colors ${form.shirt_size === s ? "bg-forest text-bone border-forest" : "border-sh-border text-charcoal/70 hover:border-moss"}`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-charcoal/60">Bonus Minuman (wajib)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[{ k: "kopi", l: "Kopi Susu Forest" }, { k: "cokelat", l: "Cokelat Hangat" }].map((d) => (
                      <button key={d.k} data-testid={`drink-${d.k}`} onClick={() => set("drink_bonus", d.k)}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-colors ${form.drink_bonus === d.k ? "bg-forest/5 border-forest text-forest" : "border-sh-border text-charcoal/70 hover:border-moss"}`}>
                        <Coffee size={15} /> {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-charcoal/60 pt-2">
                  <input type="checkbox" data-testid="agree-terms" checked={form.agreed_terms} onChange={(e) => set("agreed_terms", e.target.checked)} className="mt-0.5" />
                  Saya menyetujui syarat & ketentuan dan kebijakan keselamatan.
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-full border border-sh-border text-charcoal/70">Kembali</button>
                  <button data-testid="booking-next-1" onClick={next} className="flex-1 py-3 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors">Lanjut</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4" data-testid="booking-step-payment">
                <div className="bg-bone rounded-xl border border-sh-border p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-charcoal/60">{trip.title} × {form.participants}</span><span>{idr(trip.price * form.participants)}</span></div>
                  <div className="flex justify-between"><span className="text-charcoal/60">Biaya proses</span><span>{idr(fee)}</span></div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-sh-border mt-2"><span>Total</span><span className="text-forest">{idr(total)}</span></div>
                </div>

                <div className="bg-forest/5 rounded-xl p-4 text-sm">
                  <p className="font-medium text-charcoal mb-2">Transfer Manual ke:</p>
                  <p className="text-charcoal/70">{settings.bank_name} · <span className="font-mono">{settings.account_number}</span></p>
                  <p className="text-charcoal/70">a.n. {settings.account_holder}</p>
                  <button onClick={() => { navigator.clipboard.writeText(settings.account_number || ""); toast.success("No. rekening disalin"); }} className="mt-2 text-xs text-forest flex items-center gap-1"><Copy size={12} /> Salin No. Rekening</button>
                </div>

                <div>
                  <label className="text-xs text-charcoal/60">Upload Bukti Transfer</label>
                  <label className="mt-1 flex items-center gap-2 p-3 rounded-xl border border-dashed border-sh-border cursor-pointer text-sm text-charcoal/60 hover:border-moss">
                    <Upload size={15} /> {form.payment_proof ? "Bukti terunggah ✓" : "Pilih gambar (maks 3MB)"}
                    <input type="file" accept="image/*" data-testid="input-proof" onChange={onFile} className="hidden" />
                  </label>
                  {form.payment_proof && <img src={form.payment_proof} alt="proof" className="mt-2 rounded-lg h-24 object-cover" />}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full border border-sh-border text-charcoal/70">Kembali</button>
                  <button data-testid="booking-submit" disabled={submitting} onClick={submit} className="flex-1 py-3 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors disabled:opacity-50">{submitting ? "Memproses…" : "Konfirmasi Booking"}</button>
                </div>
              </div>
            )}

            {step === 3 && booking && (
              <div className="text-center space-y-3" data-testid="booking-step-confirm">
                <div className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto"><Check className="text-moss" /></div>
                <h3 className="font-serif text-2xl text-charcoal">Booking Terkirim!</h3>
                <p className="text-sm text-charcoal/60">Kode booking Anda:</p>
                <p className="font-mono text-lg text-forest" data-testid="booking-code">{booking.booking_code}</p>
                <p className="text-xs text-charcoal/50">Admin akan memverifikasi pembayaran Anda. Simpan kode ini untuk cek status & invoice.</p>
                <button data-testid="view-invoice" onClick={() => nav(`/booking/${booking.booking_code}`)} className="w-full py-3 rounded-full bg-forest text-bone font-medium">Lihat Invoice</button>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
