import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Mountain } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const links = [
  { label: "Home", to: "/" },
  { label: "Experiences", to: "/experiences" },
  { label: "Shop", to: "/shop" },
  { label: "Journal", to: "/journal" },
  { label: "FAQ", to: "/#faq" },
  { label: "Contact", to: "/#contact" },
];

export const Navbar = ({ transparent = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !transparent || scrolled;
  const goto = (to) => {
    setOpen(false);
    if (to.startsWith("/#")) {
      if (loc.pathname !== "/") { nav("/"); setTimeout(() => document.querySelector(to.slice(1))?.scrollIntoView({ behavior: "smooth" }), 400); }
      else document.querySelector(to.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else nav(to);
  };

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${solid ? "bg-bone/95 backdrop-blur border-b border-sh-border" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 h-20 flex items-center justify-between">
        <button data-testid="nav-logo" onClick={() => goto("/")} className="flex items-center gap-2.5">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="logo" className="h-9 w-auto object-contain" />
          ) : (
            <Mountain className={`h-6 w-6 ${solid ? "text-forest" : "text-bone"}`} strokeWidth={1.5} />
          )}
          <span className={`font-serif text-lg tracking-tight ${solid ? "text-charcoal" : "text-bone"}`}>
            {settings.brand_name || "Silent Hiking"}
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.label}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              onClick={() => goto(l.to)}
              className={`text-sm transition-colors hover:text-moss ${solid ? "text-charcoal/80" : "text-bone/90"}`}
            >
              {l.label}
            </button>
          ))}
          <button
            data-testid="nav-daftar"
            onClick={() => goto("/experiences")}
            className="px-5 py-2.5 rounded-full bg-forest text-bone text-sm font-medium hover:bg-forest-dark transition-colors"
          >
            Daftar Sekarang
          </button>
        </nav>

        <button data-testid="nav-mobile-toggle" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className={solid ? "text-charcoal" : "text-bone"} /> : <Menu className={solid ? "text-charcoal" : "text-bone"} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-bone border-t border-sh-border px-6 py-4 space-y-3">
          {links.map((l) => (
            <button key={l.label} onClick={() => goto(l.to)} className="block w-full text-left py-2 text-charcoal/80">
              {l.label}
            </button>
          ))}
          <button onClick={() => goto("/experiences")} className="w-full px-5 py-3 rounded-full bg-forest text-bone text-sm font-medium">
            Daftar Sekarang
          </button>
        </div>
      )}
    </header>
  );
};
