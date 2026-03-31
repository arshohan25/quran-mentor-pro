import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">{t("নামাজ শিক্ষা", "Prayer Guide", "دليل الصلاة")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6 max-w-2xl">
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("মাযহাব নির্বাচন করুন", "Select Madhab", "اختر المذهب")}
          </label>
          <Select value={selectedMadhab} onValueChange={(v) => setSelectedMadhab(v as Madhab)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
              <TabsTrigger key={p.name} value={p.name} className="flex-1 min-w-0 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {language === "bn" ? p.nameBn : p.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {prayers.map((prayer) => (
            <TabsContent key={prayer.name} value={prayer.name}>
              <div className="islamic-card p-4 mb-4 relative overflow-hidden">
                <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
                <span className="corner-ornament top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" />
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {language === "bn" ? prayer.nameBn : prayer.name}
                    </h2>
                    <span className="font-arabic text-primary text-lg">{prayer.nameAr}</span>
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
                    <AccordionItem key={idx} value={`step-${idx}`} className="islamic-card px-4">
                      <AccordionTrigger className="text-sm font-medium">
                        {idx + 1}. {language === "bn" ? step.stepBn : step.step}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 relative overflow-hidden">
                            <span className="corner-ornament top-0 right-0 border-t border-r rounded-tr-md !w-3 !h-3" />
                            <span className="corner-ornament bottom-0 left-0 border-b border-l rounded-bl-md !w-3 !h-3" />
                            <p className="font-arabic text-xl leading-loose text-foreground text-right">
                              {step.content.arabic}
                            </p>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line">{step.content.bengali}</p>
                          {step.content.transliteration && (
                            <p className="text-xs text-muted-foreground italic">{step.content.transliteration}</p>
                          )}
                          {step.notes?.[selectedMadhab] && (
                            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                              <p className="text-xs font-semibold text-accent mb-1">
                                {language === "bn" ? `${currentMadhab.nameBn} মাযহাবের নিয়ম:` : `${currentMadhab.name} ruling:`}
                              </p>
                              <p className="text-sm text-foreground">{step.notes[selectedMadhab]}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="tashahhud" className="islamic-card px-4">
                    <AccordionTrigger className="text-sm font-medium">
                      {t("তাশাহুদ (আত্তাহিয়্যাতু)", "Tashahhud", "التشهد")}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-primary/5 rounded-lg p-3 mb-2 border border-primary/10">
                        <p className="font-arabic text-lg leading-loose text-foreground text-right">{tashahhud.arabic}</p>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{tashahhud.bengali}</p>
                      {tashahhud.transliteration && <p className="text-xs text-muted-foreground italic mt-1">{tashahhud.transliteration}</p>}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="durood" className="islamic-card px-4">
                    <AccordionTrigger className="text-sm font-medium">
                      {t("দরূদ শরীফ", "Durood Shareef", "الصلاة على النبي")}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-primary/5 rounded-lg p-3 mb-2 border border-primary/10">
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
