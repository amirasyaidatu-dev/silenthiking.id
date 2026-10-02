import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { idr } from "@/lib/format";
import api from "@/lib/api";

const cats = ["All", "Apparel", "Accessories", "Merchandise", "Limited Edition"];

export default function Shop() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("All");
  const nav = useNavigate();

  useEffect(() => { api.get("/apparel").then((r) => setItems(r.data)).catch(() => {}); }, []);
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <section className="pt-36 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <p className="overline text-forest mb-4">Shop</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-charcoal mb-6">The Collection.</h1>
        <p className="text-charcoal/60 max-w-xl mb-10">Pieces inspired by movement, nature, and a slower way of living.</p>
        <div className="flex gap-3 mb-12 flex-wrap">
          {cats.map((c) => (
            <button key={c} data-testid={`shop-filter-${c.toLowerCase().replace(/ /g, "-")}`} onClick={() => setCat(c)}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${cat === c ? "bg-forest text-bone" : "bg-bone-alt border border-sh-border text-charcoal/70 hover:border-moss"}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {shown.map((a) => (
            <div key={a.id} data-testid={`product-${a.slug}`} onClick={() => nav(`/apparel/${a.slug}`)} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3">
                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] bg-bone/90 text-forest">{a.category}</span>
              </div>
              <h3 className="text-sm font-medium text-charcoal group-hover:text-forest transition-colors">{a.name}</h3>
              <p className="text-sm text-charcoal/60">{idr(a.price)}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
