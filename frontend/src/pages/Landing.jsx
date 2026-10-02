import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wind, Users, Sprout, Compass, Star } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { TripCard } from "@/components/site/TripCard";
import { useSettings } from "@/context/SettingsContext";
import { idr } from "@/lib/format";
import api from "@/lib/api";

const features = [
  { icon: Wind, title: "Mindful Experience", desc: "Every step, breath, and moment intentionally crafted." },
  { icon: Users, title: "Small & Curated", desc: "Max 15 participants for a deep, intimate experience." },
  { icon: Sprout, title: "Beginner Friendly", desc: "Designed for all fitness levels and first-timers." },
  { icon: Compass, title: "Intentional Journey", desc: "Purpose-driven routes with mindfulness checkpoints." },
];

const faqs = [
  { q: "What is Silent Hiking?", a: "Silent Hiking adalah pengalaman berjalan di alam dengan mengutamakan keheningan, kehadiran penuh, dan koneksi dengan lingkungan sekitar." },
  { q: "Is it beginner friendly?", a: "Ya, semua pengalaman kami dirancang untuk peserta dari semua tingkat kebugaran. Kami memilih jalur yang sesuai." },
  { q: "How many participants join each trip?", a: "Setiap sesi dibatasi maksimal 15 peserta untuk menjaga kualitas pengalaman dan nuansa intim kelompok kecil." },
  { q: "What should I bring?", a: "Sepatu hiking yang nyaman, air minum, baju berlapis, jurnal (opsional), dan pikiran yang terbuka." },
];

export default function Landing() {
  const { settings } = useSettings();
  const [trips, setTrips] = useState([]);
  const [apparel, setApparel] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/trips").then((r) => setTrips(r.data.slice(0, 3))).catch(() => {});
    api.get("/apparel").then((r) => setApparel(r.data.slice(0, 4))).catch(() => {});
    api.get("/blogs").then((r) => setBlogs(r.data.slice(0, 3))).catch(() => {});
    api.get("/reviews").then((r) => setReviews(r.data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="bg-bone">
      <Navbar transparent />

      {/* HERO */}
      <section className="relative h-screen min-h-[640px] flex items-center">
        <img src={settings.hero_image_url} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal/45" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full">
          <p className="overline text-bone/80 mb-6 sh-reveal">Mindful Outdoor Movement</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-bone leading-[1.05] max-w-3xl sh-reveal" style={{ animationDelay: "0.1s" }}>
            A Quieter Place<br />For A Brighter You.
          </h1>
          <p className="text-bone/85 text-lg mt-6 max-w-xl sh-reveal" style={{ animationDelay: "0.2s" }}>
            Walk slowly. Be present. Feel more. Silent Hiking Indonesia creates mindful outdoor experiences.
          </p>
          <div className="flex flex-wrap gap-4 mt-10 sh-reveal" style={{ animationDelay: "0.3s" }}>
            <button data-testid="hero-daftar" onClick={() => nav("/experiences")} className="px-7 py-3.5 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors flex items-center gap-2">
              Daftar Sekarang <ArrowRight size={18} />
            </button>
            <button data-testid="hero-explore" onClick={() => nav("/experiences")} className="px-7 py-3.5 rounded-full border border-bone/40 text-bone font-medium hover:bg-bone/10 transition-colors">
              Jelajahi Pengalaman
            </button>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="overline text-forest mb-5">Our Philosophy</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal leading-tight">More Than<br />A Hike.</h2>
            <p className="text-charcoal/65 mt-6 leading-relaxed max-w-md">
              Bukan sekadar berjalan menuju destinasi. Kami menciptakan ruang untuk memperlambat langkah, mengurangi distraksi, dan menikmati perjalanan dengan lebih sadar.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-bone-alt border border-sh-border rounded-2xl p-6 hover:border-moss transition-colors">
                <f.icon className="text-forest mb-4" strokeWidth={1.5} />
                <h3 className="font-serif text-lg text-charcoal mb-2">{f.title}</h3>
                <p className="text-sm text-charcoal/55 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE BREAK */}
      <section className="relative h-[55vh] min-h-[380px] flex items-center justify-center">
        <img src="https://images.unsplash.com/photo-1465652044861-81e32c824058?w=1600&h=900&fit=crop&auto=format" alt="trail" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal/55" />
        <p className="relative font-serif italic text-2xl sm:text-4xl text-bone text-center max-w-3xl px-6">
          "In silence, we begin to hear what matters."
        </p>
      </section>

      {/* UPCOMING TRIPS */}
      <section id="experiences" className="py-24 md:py-32 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="overline text-forest mb-4">Upcoming</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Perjalanan Selanjutnya</h2>
          </div>
          <button data-testid="see-all-trips" onClick={() => nav("/experiences")} className="text-sm text-forest font-medium flex items-center gap-2 hover:gap-3 transition-all">
            Lihat Semua Aktivitas <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map((t, i) => <TripCard key={t.id} trip={t} index={i} />)}
        </div>
      </section>

      {/* SHOP TEASER */}
      <section className="py-24 bg-bone-dark">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="overline text-forest mb-4">The Collection</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Wear The Journey.</h2>
            </div>
            <button data-testid="explore-collection" onClick={() => nav("/shop")} className="text-sm text-forest font-medium flex items-center gap-2 hover:gap-3 transition-all">
              Explore Collection <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {apparel.map((a) => (
              <div key={a.id} onClick={() => nav(`/apparel/${a.slug}`)} data-testid={`shop-teaser-${a.slug}`} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3">
                  <img src={a.image_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="text-sm font-medium text-charcoal">{a.name}</h3>
                <p className="text-sm text-charcoal/60">{idr(a.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {reviews.length > 0 && (
        <section className="py-24 md:py-32 max-w-5xl mx-auto px-6 sm:px-8 md:px-12 text-center">
          <p className="overline text-forest mb-6">Community</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-10">What Our Community Says</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {reviews.map((r) => (
              <div key={r.id} className="bg-bone-alt border border-sh-border rounded-2xl p-7">
                <div className="flex gap-1 mb-3">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={15} className="fill-earth text-earth" />)}</div>
                <p className="font-serif italic text-lg text-charcoal/80 leading-relaxed">"{r.comment}"</p>
                <p className="text-sm text-charcoal/50 mt-4">— {r.reviewer_name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* JOURNAL */}
      <section className="py-24 bg-bone-dark">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="overline text-forest mb-4">Journal</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Stories From The Trail.</h2>
            </div>
            <button data-testid="all-stories" onClick={() => nav("/journal")} className="text-sm text-forest font-medium flex items-center gap-2 hover:gap-3 transition-all">
              All Stories <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {blogs.map((b) => (
              <div key={b.id} onClick={() => nav(`/journal/${b.slug}`)} data-testid={`journal-card-${b.slug}`} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4">
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs bg-bone/90 text-forest">{b.category}</span>
                </div>
                <p className="text-xs text-charcoal/40 mb-1">{b.read_time}</p>
                <h3 className="font-serif text-xl text-charcoal group-hover:text-forest transition-colors">{b.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIAL PROGRAMS */}
      <section className="relative py-28">
        <img src="https://images.unsplash.com/photo-1763713437177-d3cf82444b96?w=1600&h=900&fit=crop&auto=format" alt="programs" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal/80" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="overline text-moss mb-5">Special Programs</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-bone mb-6">Create Your Own Journey.</h2>
          <p className="text-bone/70 leading-relaxed">Kami menyediakan program khusus untuk perusahaan, brand, komunitas, dan individu yang ingin pengalaman mindful outdoor yang lebih personal dan eksklusif.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 max-w-3xl mx-auto px-6 sm:px-8 md:px-12">
        <p className="overline text-forest mb-5 text-center">Questions</p>
        <h2 className="font-serif text-4xl sm:text-5xl text-charcoal text-center mb-12">Common Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-item-${i}`} className="border-b border-sh-border">
              <AccordionTrigger className="font-serif text-lg text-charcoal hover:text-forest text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-charcoal/65 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-bone-dark">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="overline text-forest mb-5">Contact</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-charcoal mb-6">Let's Talk.</h2>
          <p className="text-charcoal/65 mb-2">{settings.contact_email || "hello@silenthiking.id"}</p>
          <p className="text-charcoal/65 mb-2">{settings.contact_whatsapp || "+62 812 3456 7890"}</p>
          <p className="text-charcoal/65">{settings.contact_instagram || "@silenthikingid"}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
