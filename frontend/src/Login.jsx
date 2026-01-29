import React, { useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import config from "./config/config.js";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem(config.auth.tokenStorageKey, token);
      setUser(user);
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 423) {
        setError(err.response.data.message || "Account temporarily locked. Please try again later.");
      } else if (err.response?.status === 401) {
        setError(err.response.data.message || "Invalid email or password. Please check your credentials.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please check your internet connection.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-900 to-slate-950"></div>
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="w-full max-w-md opacity-0 animate-slide-in-up">
        {/* Glow effect behind card */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-amber-500/20 rounded-3xl blur-2xl"></div>
        
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-10 shadow-2xl">
          <div className="mb-8">
            <h2 
              className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-amber-400"
              style={{fontFamily: "'Playfair Display', serif"}}
            >
              Welcome Back
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-amber-500 rounded-full" />
              <div className="h-1 w-6 bg-amber-500/50 rounded-full" />
            </div>
            <p className="text-slate-400">Enter your credentials to access EventSphere</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-slate-300 font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="relative w-full overflow-hidden group bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3.5 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative">{loading ? "Logging in..." : "Login"}</span>
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Don't have an account? Contact your system administrator.
            </p>
            <a 
              href="/" 
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors group"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}