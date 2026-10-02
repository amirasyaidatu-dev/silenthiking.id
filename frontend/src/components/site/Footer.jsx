import { Link } from "react-router-dom";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer data-testid="site-footer" className="bg-charcoal text-bone/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-serif text-2xl text-bone mb-3">{settings.brand_name || "Silent Hiking Indonesia"}</h3>
          <p className="text-sm max-w-sm leading-relaxed">{settings.brand_tagline || "Walk Slowly. Be Present. Feel More."}</p>
          <p className="text-sm max-w-sm leading-relaxed mt-4 text-bone/60">
            Mindful outdoor experiences that invite you to slow down, disconnect from noise, and reconnect with nature.
          </p>
        </div>
        <div>
          <p className="overline text-moss mb-4">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/experiences" className="hover:text-bone transition-colors">Experiences</Link></li>
            <li><Link to="/shop" className="hover:text-bone transition-colors">Shop</Link></li>
            <li><Link to="/journal" className="hover:text-bone transition-colors">Journal</Link></li>
            <li><Link to="/admin/login" className="hover:text-bone transition-colors">Admin</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline text-moss mb-4">Contact</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail size={15} /> {settings.contact_email || "hello@silenthiking.id"}</li>
            <li className="flex items-center gap-2"><Phone size={15} /> {settings.contact_whatsapp || "+62 812 3456 7890"}</li>
            <li className="flex items-center gap-2"><Instagram size={15} /> {settings.contact_instagram || "@silenthikingid"}</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> Jakarta, Indonesia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bone/10 py-6 text-center text-xs text-bone/40">
        © {new Date().getFullYear()} Silent Hiking Indonesia. All rights reserved.
      </div>
    </footer>
  );
};
