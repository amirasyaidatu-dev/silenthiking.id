import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Clock, X, Printer, Star, Home } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { useSettings } from "@/context/SettingsContext";
import { idr, formatDate } from "@/lib/format";
import api, { apiError } from "@/lib/api";

const statusMap = {
  APPROVED: { icon: Check, label: "Pembayaran Dikonfirmasi", cls: "bg-moss/15 text-moss" },
  PENDING: { icon: Clock, label: "Menunggu Verifikasi", cls: "bg-earth/15 text-earth" },
  REJECTED: { icon: X, label: "Pembayaran Ditolak", cls: "bg-red-100 text-red-700" },
};

export default function BookingConfirmation() {
  const { code } = useParams();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [b, setB] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => { api.get(`/bookings/${code}`).then((r) => setB(r.data)).catch(() => toast.error("Booking tidak ditemukan")); }, [code]);
  if (!b) return <div className="min-h-screen bg-bone"><Navbar /><div className="pt-40 text-center text-charcoal/50">Memuat…</div></div>;

  const st = statusMap[b.payment_status] || statusMap.PENDING;
  const submitReview = async () => {
    try {
      await api.post("/reviews", { booking_code: code, rating, comment });
      setReviewed(true);
      toast.success("Ulasan terkirim, menunggu moderasi admin");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 max-w-2xl mx-auto px-6 sm:px-8">
        <div className="bg-white border border-sh-border rounded-2xl overflow-hidden print:border-0" id="invoice">
          <div className="bg-forest text-bone p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="overline text-bone/70 mb-1">Invoice</p>
                <h1 className="font-serif text-2xl">{settings.brand_name || "Silent Hiking Indonesia"}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-bone/70">Booking Code</p>
                <p className="font-mono text-lg" data-testid="invoice-code">{b.booking_code}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${st.cls}`} data-testid="booking-status">
              <st.icon size={15} /> {st.label}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-charcoal/50">Peserta</p><p className="font-medium text-charcoal">{b.full_name}</p></div>
              <div><p className="text-charcoal/50">WhatsApp</p><p className="font-medium text-charcoal">{b.whatsapp_number}</p></div>
              <div><p className="text-charcoal/50">Trip</p><p className="font-medium text-charcoal">{b.trip?.title}</p></div>
              <div><p className="text-charcoal/50">Tanggal</p><p className="font-medium text-charcoal">{b.schedule ? formatDate(b.schedule.event_date) : "-"}</p></div>
              <div><p className="text-charcoal/50">Lokasi</p><p className="font-medium text-charcoal">{b.trip?.location}</p></div>
              <div><p className="text-charcoal/50">Jumlah</p><p className="font-medium text-charcoal">{b.participants} orang</p></div>
              <div><p className="text-charcoal/50">Ukuran Kaos</p><p className="font-medium text-charcoal">{b.shirt_size}</p></div>
              <div><p className="text-charcoal/50">Bonus Minuman</p><p className="font-medium text-charcoal capitalize">{b.drink_bonus}</p></div>
            </div>

            <div className="border-t border-sh-border pt-4 flex justify-between items-center">
              <span className="text-charcoal/60">Total Pembayaran</span>
              <span className="font-serif text-2xl text-forest" data-testid="invoice-total">{idr(b.total_amount)}</span>
            </div>

            {b.payment_status === "APPROVED" && b.wa_group_link && (
              <a href={b.wa_group_link} target="_blank" rel="noreferrer" className="block text-center py-3 rounded-full bg-moss/15 text-moss text-sm no-print">Gabung Grup WhatsApp Trip →</a>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 no-print">
          <button data-testid="print-invoice" onClick={() => window.print()} className="flex-1 py-3 rounded-full bg-forest text-bone font-medium flex items-center justify-center gap-2"><Printer size={16} /> Cetak Invoice</button>
          <button onClick={() => nav("/")} className="px-5 py-3 rounded-full border border-sh-border text-charcoal/70 flex items-center gap-2"><Home size={16} /> Beranda</button>
        </div>

        {b.payment_status === "APPROVED" && !reviewed && (
          <div className="mt-8 bg-white border border-sh-border rounded-2xl p-6 no-print" data-testid="review-form">
            <h3 className="font-serif text-xl text-charcoal mb-4">Bagikan Pengalaman Anda</h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} data-testid={`star-${n}`} onClick={() => setRating(n)}><Star size={24} className={n <= rating ? "fill-earth text-earth" : "text-sh-border"} /></button>
              ))}
            </div>
            <textarea data-testid="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ceritakan pengalaman Anda…" className="w-full p-3 rounded-xl border border-sh-border text-sm mb-3" rows={3} />
            <button data-testid="submit-review" onClick={submitReview} className="px-6 py-3 rounded-full bg-forest text-bone font-medium">Kirim Ulasan</button>
          </div>
        )}
      </section>
    </div>
  );
}
