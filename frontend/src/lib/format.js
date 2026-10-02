export const idr = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
};

export const formatDateShort = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
};
