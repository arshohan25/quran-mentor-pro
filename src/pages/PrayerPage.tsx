import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookText, ScrollText, Sparkles } from "lucide-react";
import { prayers, madhabs, tashahhud, durood, type Madhab } from "@/data/prayerData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function PrayerPage() {
  const { t, language } = useLanguage();
  const [selectedMadhab, setSelectedMadhab] = useState<Madhab>("hanafi");
  const currentMadhab = madhabs.find((m) => m.id === selectedMadhab)!;

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("সঠিকভাবে নামাজ শিখুন", "Learn prayer correctly", "تعلم الصلاة")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-5 max-w-2xl">
        <div className="mb-5">
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
            {t("মাযহাব নির্বাচন করুন", "Select Madhab", "اختر المذهب")}
          </label>
          <Select value={selectedMadhab} onValueChange={(v) => setSelectedMadhab(v as Madhab)}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {madhabs.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {language === "bn" ? m.nameBn : m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="Fajr">
          <TabsList className="w-full flex overflow-x-auto mb-4 scrollbar-hide bg-muted/50">
            {prayers.map((p) => (
              <TabsTrigger key={p.name} value={p.name} className="flex-1 min-w-0 text-[10px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {language === "bn" ? p.nameBn : p.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {prayers.map((prayer) => (
            <TabsContent key={prayer.name} value={prayer.name}>
              <div className="premium-card p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="icon-container p-2">
                    <BookText className="w-5 h-5 text-primary" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {language === "bn" ? prayer.nameBn : prayer.name}
                    </h2>
                    <span className="font-arabic text-primary text-base">{prayer.nameAr}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">{language === "bn" ? currentMadhab.nameBn : currentMadhab.name}:</span>{" "}
                  {prayer.rakats[selectedMadhab]}
                </p>
              </div>

              <ScrollArea className="h-[calc(100vh-350px)] min-h-[200px]">
                <Accordion type="multiple" className="space-y-2">
                  {prayer.steps.map((step, idx) => (
                    <AccordionItem key={idx} value={`step-${idx}`} className="premium-card px-4">
                      <AccordionTrigger className="text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">{idx + 1}</span>
                          {language === "bn" ? step.stepBn : step.step}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/10">
                            <p className="font-arabic text-xl leading-loose text-foreground text-right">
                              {step.content.arabic}
                            </p>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line">{step.content.bengali}</p>
                          {step.content.transliteration && (
                            <p className="text-xs text-muted-foreground italic">{step.content.transliteration}</p>
                          )}
                          {step.notes?.[selectedMadhab] && (
                            <div className="bg-accent/8 rounded-xl p-3 border border-accent/15">
                              <p className="text-xs font-bold text-accent mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                {language === "bn" ? `${currentMadhab.nameBn} মাযহাবের নিয়ম:` : `${currentMadhab.name} ruling:`}
                              </p>
                              <p className="text-sm text-foreground">{step.notes[selectedMadhab]}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="tashahhud" className="premium-card px-4">
                    <AccordionTrigger className="text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-primary" strokeWidth={1.6} />
                        {t("তাশাহুদ (আত্তাহিয়্যাতু)", "Tashahhud", "التشهد")}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-primary/5 rounded-xl p-3 mb-2 border border-primary/10">
                        <p className="font-arabic text-lg leading-loose text-foreground text-right">{tashahhud.arabic}</p>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{tashahhud.bengali}</p>
                      {tashahhud.transliteration && <p className="text-xs text-muted-foreground italic mt-1">{tashahhud.transliteration}</p>}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="durood" className="premium-card px-4">
                    <AccordionTrigger className="text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-accent" strokeWidth={1.6} />
                        {t("দরূদ শরীফ", "Durood Shareef", "الصلاة على النبي")}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-primary/5 rounded-xl p-3 mb-2 border border-primary/10">
                        <p className="font-arabic text-lg leading-loose text-foreground text-right">{durood.arabic}</p>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{durood.bengali}</p>
                      {durood.transliteration && <p className="text-xs text-muted-foreground italic mt-1">{durood.transliteration}</p>}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
