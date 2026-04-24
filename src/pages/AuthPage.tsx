import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBn = language === "bn";

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success(isBn ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(isBn ? "স্বাগতম" : "Welcome back");
      }
    } catch (err: any) {
      toast.error(err?.message ?? (isBn ? "ত্রুটি ঘটেছে" : "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        {isBn ? "হোম" : "Home"}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center"
      >
        <Card className="w-full max-w-sm p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              {mode === "signin"
                ? (isBn ? "সাইন ইন" : "Sign in")
                : (isBn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isBn
                ? "আপনার অগ্রগতি সকল ডিভাইসে সিঙ্ক করুন"
                : "Sync your progress across devices"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isBn ? "Google দিয়ে চালিয়ে যান" : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">
                {isBn ? "অথবা" : "or"}
              </span>
            </div>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{isBn ? "নাম" : "Name"}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{isBn ? "ইমেইল" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{isBn ? "পাসওয়ার্ড" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "signin"
                ? (isBn ? "সাইন ইন" : "Sign in")
                : (isBn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account")}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? (isBn ? "অ্যাকাউন্ট নেই? সাইন আপ" : "No account? Sign up")
              : (isBn ? "ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন" : "Already have an account? Sign in")}
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
