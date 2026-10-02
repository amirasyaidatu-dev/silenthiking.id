import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import { idr, formatDateShort } from "@/lib/format";

export const TripCard = ({ trip, index = 0 }) => {
  const next = trip.schedules?.[0];
  const slots = trip.total_slots_left ?? 0;
  const diffColor = trip.difficulty === "Moderate" ? "bg-earth/15 text-earth" : trip.difficulty === "Private" ? "bg-charcoal/10 text-charcoal" : "bg-moss/15 text-moss";
  return (
    <Link
      data-testid={`trip-card-${trip.slug}`}
      to={`/trips/${trip.slug}`}
      className="group block bg-bone-alt border border-sh-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
    >
      <div className="relative h-72 overflow-hidden">
        <img src={trip.image_url} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${diffColor} bg-bone/90 backdrop-blur`}>{trip.difficulty}</span>
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-forest text-bone">{idr(trip.price)}</span>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-xl text-charcoal mb-3 group-hover:text-forest transition-colors">{trip.title}</h3>
        <div className="space-y-1.5 text-sm text-charcoal/60">
          <p className="flex items-center gap-2"><MapPin size={14} /> {trip.location}</p>
          <p className="flex items-center gap-2"><Clock size={14} /> {trip.duration}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-sh-border flex items-center justify-between">
          <span className="text-xs text-charcoal/50">{next ? formatDateShort(next.event_date) : "Jadwal menyusul"}</span>
          <span className={`text-xs font-semibold ${slots <= 3 ? "text-earth" : "text-moss"}`}>{slots} slot tersisa</span>
        </div>
      </div>
    </Link>
  );
};
