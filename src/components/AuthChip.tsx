import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { LogIn, User as UserIcon } from "lucide-react";

export default function AuthChip() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const isBn = language === "bn";

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground/90 transition"
      >
        <LogIn className="w-3.5 h-3.5" />
        {isBn ? "সাইন ইন" : "Sign in"}
      </Link>
    );
  }

  const initial = (user.user_metadata?.full_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <Link
      to="/account"
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-xs font-semibold"
      aria-label={isBn ? "অ্যাকাউন্ট" : "Account"}
    >
      {user.user_metadata?.avatar_url ? (
        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        initial
      )}
    </Link>
  );
}
