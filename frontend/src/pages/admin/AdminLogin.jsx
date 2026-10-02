import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mountain, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Selamat datang kembali");
      nav("/admin");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <div className="absolute inset-0 opacity-20">
        <img src="https://images.unsplash.com/photo-1758438919146-f3f59a6d2544?w=1600&h=1000&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
      </div>
      <form onSubmit={submit} data-testid="admin-login-form" className="relative w-full max-w-sm bg-bone rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Mountain className="text-forest" strokeWidth={1.5} />
          <span className="font-serif text-lg text-charcoal">Silent Hiking Admin</span>
        </div>
        <p className="overline text-forest mb-1">Dashboard</p>
        <h1 className="font-serif text-3xl text-charcoal mb-6">Masuk</h1>
        <input data-testid="login-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm mb-3" />
        <input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 rounded-xl border border-sh-border bg-white text-sm mb-5" />
        <button data-testid="login-submit" disabled={loading} className="w-full py-3 rounded-full bg-forest text-bone font-medium hover:bg-forest-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <Lock size={15} /> {loading ? "Memproses…" : "Login"}
        </button>
      </form>
    </div>
  );
}
