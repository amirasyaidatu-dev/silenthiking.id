import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { formatDate } from "@/lib/format";
import api from "@/lib/api";

const cats = ["All", "Mindfulness", "Outdoor", "Stories", "Tips", "Lifestyle"];

export default function Journal() {
  const [blogs, setBlogs] = useState([]);
  const [cat, setCat] = useState("All");
  const nav = useNavigate();

  useEffect(() => { api.get("/blogs").then((r) => setBlogs(r.data)).catch(() => {}); }, []);
  const shown = cat === "All" ? blogs : blogs.filter((b) => b.category === cat);
  const [featured, ...rest] = shown;

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <section className="pt-36 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <p className="overline text-forest mb-4">Journal</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-charcoal mb-10">Stories From The Trail.</h1>

        {featured && (
          <div onClick={() => nav(`/journal/${featured.slug}`)} data-testid={`journal-featured-${featured.slug}`} className="group cursor-pointer grid md:grid-cols-2 gap-8 mb-16 bg-bone-alt border border-sh-border rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
              <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="overline text-moss mb-3">Featured · {featured.category}</span>
              <h2 className="font-serif text-3xl text-charcoal mb-3 group-hover:text-forest transition-colors">{featured.title}</h2>
              <p className="text-charcoal/60 leading-relaxed mb-4">{featured.excerpt}</p>
              <p className="text-xs text-charcoal/40">{formatDate(featured.published_at)} · {featured.read_time}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-10 flex-wrap">
          {cats.map((c) => (
            <button key={c} data-testid={`journal-filter-${c.toLowerCase()}`} onClick={() => setCat(c)}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${cat === c ? "bg-forest text-bone" : "bg-bone-alt border border-sh-border text-charcoal/70 hover:border-moss"}`}>{c}</button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {rest.map((b) => (
            <div key={b.id} data-testid={`journal-item-${b.slug}`} onClick={() => nav(`/journal/${b.slug}`)} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs bg-bone/90 text-forest">{b.category}</span>
              </div>
              <p className="text-xs text-charcoal/40 mb-1">{b.read_time}</p>
              <h3 className="font-serif text-xl text-charcoal group-hover:text-forest transition-colors mb-1">{b.title}</h3>
              <p className="text-sm text-charcoal/55">{b.excerpt}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
