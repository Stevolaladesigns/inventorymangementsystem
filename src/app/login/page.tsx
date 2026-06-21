"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // To preserve compatibility with components like Sidebar and hooks that read
      // the user details directly from localStorage and custom userSession/isLoggedIn cookies,
      // we fetch the authenticated session details.
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      if (session?.user) {
        const userObj = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        };
        const sessionStr = JSON.stringify(userObj);
        localStorage.setItem("userSession", sessionStr);
        document.cookie = `isLoggedIn=true; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `userSession=${encodeURIComponent(sessionStr)}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-background font-body min-h-screen">
      {/* Left Column: Cover & Brand Promo */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between overflow-hidden bg-[#1a1410]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/login_warehouse_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(26, 20, 16, 0.82) 0%, rgba(42, 31, 20, 0.86) 60%, rgba(26, 20, 16, 0.82) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-10">
          {/* Logo */}
          <div>
            <img
              src="/images/bidwest.png"
              alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Value Pitch */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-0.5 bg-primary rounded-full"></div>
              <span className="text-sm md:text-base font-bold tracking-widest uppercase text-[#c8a882]">
                Inventory Management System
              </span>
            </div>
            <h1 className="font-headings font-bold text-white text-5xl md:text-6xl leading-tight">
              Complete control
              <br />
              <span className="text-[#c8a882]">over your stock.</span>
            </h1>
            <p className="text-base md:text-lg text-white max-w-md leading-relaxed">
              Track products, manage suppliers, record sales, and generate
              reports — all in one place.
            </p>


          </div>

          {/* Features Line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-[11px] font-bold text-[#c8a882] tracking-wider uppercase opacity-90 font-headings">
            <span>Stock Tracking</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Low Stock Alerts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Sales Recording</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Purchase Orders</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Analytics</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Multi-User</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-10 bg-background">
        <div className="w-full max-w-sm">
          {/* Logo shown only on mobile */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img
              src="/images/logo.png"
              alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-8">
            <h2 className="text-2xl font-bold font-headings text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your {process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest"} account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-danger border border-red-200 rounded-md p-3 text-xs mb-4 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Email Address
              </label>
              <div className="flex items-center gap-2.5 border border-border rounded-md px-3 py-2.5 bg-input text-sm text-foreground focus-within:border-primary focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-[#8a8278] flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-sm font-semibold"
                  placeholder="kwame@bidwest.gh"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="flex items-center gap-2.5 border border-border rounded-md px-3 py-2.5 bg-input text-sm text-foreground focus-within:border-primary focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-[#8a8278] flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-sm font-semibold tracking-wide"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#8a8278] focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  rememberMe
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-input text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[4px]" />
              </button>
              <span
                onClick={() => setRememberMe(!rememberMe)}
                className="text-sm text-muted-foreground font-medium"
              >
                Keep me signed in
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-md text-sm font-bold font-headings flex items-center justify-center gap-2 mt-1 hover:bg-[#b0220a] transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>



          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Need access?{" "}
              <a href="#" className="text-primary hover:underline">
                Contact your administrator
              </a>
            </p>
            <p className="text-xs text-[#c4bfb9] font-medium mt-3">
              © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
