import { useState, useRef } from "react";
import { Download, Upload, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

function getAllAmalData(): Record<string, number[]> {
  const data: Record<string, number[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("daily-amal-")) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "[]");
      } catch { /* skip corrupted */ }
    }
  }
  return data;
}

function importAmalData(data: Record<string, number[]>): number {
  let count = 0;
  for (const [key, ids] of Object.entries(data)) {
    if (key.startsWith("daily-amal-") && Array.isArray(ids)) {
      localStorage.setItem(key, JSON.stringify(ids));
      count++;
    }
  }
  return count;
}

export default function DailyAmalDataSync({ onImport }: { onImport?: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExportFile = () => {
    const data = getAllAmalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-amal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("ব্যাকআপ ডাউনলোড হয়েছে ✅", "Backup downloaded ✅", "تم تنزيل النسخة الاحتياطية ✅"));
  };

  const handleCopyCode = () => {
    const data = getAllAmalData();
    const code = btoa(JSON.stringify(data));
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("কোড কপি হয়েছে!", "Code copied!", "تم نسخ الرمز!"));
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const count = importAmalData(data);
        toast.success(t(`${count} দিনের ডাটা ইম্পোর্ট হয়েছে ✅`, `${count} days imported ✅`, `تم استيراد ${count} يوم ✅`));
        onImport?.();
        setOpen(false);
      } catch {
        toast.error(t("ফাইল পড়া যায়নি ❌", "Could not read file ❌", "تعذرت قراءة الملف ❌"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportCode = () => {
    const code = prompt(t("ব্যাকআপ কোড পেস্ট করুন:", "Paste backup code:", "الصق رمز النسخة الاحتياطية:"));
    if (!code) return;
    try {
      const data = JSON.parse(atob(code));
      const count = importAmalData(data);
      toast.success(t(`${count} দিনের ডাটা ইম্পোর্ট হয়েছে ✅`, `${count} days imported ✅`, `تم استيراد ${count} يوم ✅`));
      onImport?.();
      setOpen(false);
    } catch {
      toast.error(t("কোড সঠিক নয় ❌", "Invalid code ❌", "الرمز غير صحيح ❌"));
    }
  };

  const dataCount = Object.keys(getAllAmalData()).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" />
          {t("ব্যাকআপ", "Backup", "نسخة")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t("ডাটা ব্যাকআপ ও রিস্টোর", "Backup & Restore", "النسخ الاحتياطي والاستعادة")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              `বর্তমানে ${dataCount} দিনের ডাটা আছে`,
              `Currently ${dataCount} days of data`,
              `يوجد حاليًا بيانات ${dataCount} يوم`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Export Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {t("📤 এক্সপোর্ট", "📤 Export", "📤 تصدير")}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={handleExportFile}>
                <Download className="w-3.5 h-3.5" />
                {t("ফাইল ডাউনলোড", "Download File", "تنزيل ملف")}
              </Button>
              <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={handleCopyCode}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {t("কোড কপি", "Copy Code", "نسخ الرمز")}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {t("📥 ইম্পোর্ট", "📥 Import", "📥 استيراد")}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" />
                {t("ফাইল আপলোড", "Upload File", "رفع ملف")}
              </Button>
              <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={handleImportCode}>
                <Copy className="w-3.5 h-3.5" />
                {t("কোড পেস্ট", "Paste Code", "لصق الرمز")}
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
