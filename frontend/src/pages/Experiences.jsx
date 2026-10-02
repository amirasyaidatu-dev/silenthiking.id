import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { TripCard } from "@/components/site/TripCard";
import api from "@/lib/api";

const filters = ["All", "Easy", "Moderate", "Private"];

export default function Experiences() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => { api.get("/trips").then((r) => setTrips(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const shown = filter === "All" ? trips : trips.filter((t) => t.difficulty === filter);

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <section className="pt-36 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12">
        <p className="overline text-forest mb-4">Experiences</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-charcoal mb-6">All Journeys.</h1>
        <p className="text-charcoal/60 max-w-xl mb-10">Each experience is carefully curated for depth, intention, and connection with nature.</p>
        <div className="flex gap-3 mb-12 flex-wrap">
          {filters.map((f) => (
            <button key={f} data-testid={`filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${filter === f ? "bg-forest text-bone" : "bg-bone-alt border border-sh-border text-charcoal/70 hover:border-moss"}`}>
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => <div key={i} className="h-96 rounded-2xl bg-bone-dark animate-pulse" />)}
          </div>
        ) : shown.length === 0 ? (
          <p className="text-charcoal/50 py-20 text-center">Belum ada trip pada kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shown.map((t, i) => <TripCard key={t.id} trip={t} index={i} />)}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
