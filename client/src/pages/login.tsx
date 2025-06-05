import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getEmailValidationError } from "../utils";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get the redirect path from location state, default to home
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setLoading(true);

    // Validate email
    const emailValidationError = getEmailValidationError(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true }); // Redirect to intended page
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1333] via-[#2d1b4d] to-[#1a2a4f] relative overflow-hidden">
      {/* Floating cosmic elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full animate-float neon-glow z-0"></div>
      <div
        className="absolute top-1/2 right-16 w-24 h-24 bg-pink-500/20 rounded-full animate-float neon-glow z-0"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-20 h-20 bg-cyan-500/20 rounded-full animate-float neon-glow z-0"
        style={{ animationDelay: "2s" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-blue-900/60 z-0" />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-10 rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-xl">
          <h2 className="text-4xl font-bold text-center text-white mb-8 drop-shadow-lg">
            Sign in to LaptopVerse
          </h2>
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div>
              <label className="block text-cyan-100 mb-2 font-semibold">
                Email
              </label>{" "}
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(""); // Clear error when user types
                }}
                required
              />
              {emailError && (
                <div className="text-red-400 text-sm mt-1 font-medium">
                  {emailError}
                </div>
              )}
            </div>
            <div>
              <label className="block text-cyan-100 mb-2 font-semibold">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-400 text-center font-semibold">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full cosmic-button px-8 py-3 rounded-xl text-white font-semibold text-lg mt-2 shadow-lg disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          <div className="text-center text-cyan-100 mt-6">
            Don't have an account?{" "}
            <button
              className="underline hover:text-purple-400"
              type="button"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
