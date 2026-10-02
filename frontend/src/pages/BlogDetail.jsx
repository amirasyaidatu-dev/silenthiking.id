import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { formatDate } from "@/lib/format";
import api from "@/lib/api";

export default function BlogDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [b, setB] = useState(null);

  useEffect(() => { api.get(`/blogs/${slug}`).then((r) => setB(r.data)).catch(() => {}); }, [slug]);
  if (!b) return <div className="min-h-screen bg-bone"><Navbar /><div className="pt-40 text-center text-charcoal/50">Memuat…</div></div>;

  return (
    <div className="bg-bone min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 max-w-3xl mx-auto px-6 sm:px-8">
        <button onClick={() => nav("/journal")} className="text-charcoal/60 text-sm flex items-center gap-2 mb-8 hover:text-forest"><ArrowLeft size={16} /> Journal</button>
        <p className="overline text-forest mb-4">{b.category} · {b.read_time}</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-tight mb-4">{b.title}</h1>
        <p className="text-sm text-charcoal/40 mb-8">{formatDate(b.published_at)}</p>
        <img src={b.image_url} alt={b.title} className="w-full rounded-2xl aspect-[16/9] object-cover mb-10" />
        <div className="prose prose-lg max-w-none text-charcoal/75 leading-relaxed whitespace-pre-line font-sans text-lg">{b.content}</div>
      </article>
      <Footer />
    </div>
  );
}
