import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { language } = useLanguage();
  const { isAdmin } = useUserRole();
  const isBn = language === "bn";

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setDisplayName(data?.display_name ?? "");
        setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(isBn ? "সংরক্ষিত" : "Saved");
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {isBn ? "ফিরে যান" : "Back"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-4"
      >
        <h1 className="text-2xl font-semibold">{isBn ? "অ্যাকাউন্ট" : "Account"}</h1>

        <Card className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>{isBn ? "ইমেইল" : "Email"}</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dn">{isBn ? "প্রদর্শিত নাম" : "Display name"}</Label>
            <Input
              id="dn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={profileLoading}
            />
          </div>

          <Button onClick={save} disabled={saving || profileLoading} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isBn ? "সংরক্ষণ করুন" : "Save"}
          </Button>
        </Card>

        {isAdmin && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/admin")}
          >
            <Shield className="h-4 w-4 mr-2" />
            {isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signOut();
            toast.success(isBn ? "সাইন আউট হয়েছে" : "Signed out");
            navigate("/", { replace: true });
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isBn ? "সাইন আউট" : "Sign out"}
        </Button>
      </motion.div>
    </div>
  );
}
