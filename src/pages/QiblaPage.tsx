import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, MapPin, AlertCircle, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calculateQibla(lat: number, lng: number): number {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const x = Math.sin(dLng);
  const y = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng);
  let qibla = (Math.atan2(x, y) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

function getDistance(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((KAABA_LAT * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QiblaPage() {
  const { t } = useLanguage();
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setQiblaAngle(calculateQibla(latitude, longitude));
        setDistance(Math.round(getDistance(latitude, longitude)));
        setLocationName(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        setPermissionGranted(true);
      },
      () => setError(t("লোকেশন পারমিশন দিন", "Enable location permission", "فعّل إذن الموقع"))
    );
  }, []);

  const startCompass = useCallback(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // @ts-ignore
      const alpha = e.webkitCompassHeading ?? (e.alpha ? 360 - e.alpha : null);
      if (alpha !== null) setHeading(alpha);
    };
    // @ts-ignore
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // @ts-ignore
      DeviceOrientationEvent.requestPermission().then((r: string) => {
        if (r === "granted") window.addEventListener("deviceorientation", handleOrientation, true);
        else setError(t("কম্পাস পারমিশন দিন", "Grant compass permission", "فعّل إذن البوصلة"));
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
      setTimeout(() => { setHeading((prev) => (prev === null ? 0 : prev)); }, 2000);
    }
  }, [t]);

  useEffect(() => {
    if (permissionGranted) startCompass();
  }, [permissionGranted, startCompass]);

  const needleRotation = heading !== null ? qiblaAngle - heading : qiblaAngle;

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("কিবলা ফাইন্ডার", "Qibla Finder", "مكتشف القبلة")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("কিবলার দিক জানুন", "Find Qibla direction", "اعرف اتجاه القبلة")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-8 flex flex-col items-center gap-5">
        {error ? (
          <div className="premium-card p-6 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" strokeWidth={1.4} />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <div className="absolute inset-0 rounded-full border-4 shadow-xl" style={{ borderColor: 'hsl(var(--accent) / 0.25)', boxShadow: '0 0 40px hsl(var(--accent) / 0.1)' }} />
              <div
                className="absolute inset-3 rounded-full border-2 border-border bg-card shadow-inner transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
              >
                {["N", "E", "S", "W"].map((dir, i) => (
                  <div key={dir} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 90}deg)` }}>
                    <span className={`text-xs font-bold mt-2 ${dir === "N" ? "text-destructive" : "text-muted-foreground"}`}>{dir}</span>
                  </div>
                ))}
                {Array.from({ length: 72 }, (_, i) => (
                  <div key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 5}deg)` }}>
                    <div className={`mt-1 ${i % 6 === 0 ? "w-0.5 h-3 bg-foreground/40" : "w-px h-2 bg-foreground/15"}`} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-6 flex justify-center transition-transform duration-300 ease-out" style={{ transform: `rotate(${needleRotation}deg)` }}>
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[28px] border-l-transparent border-r-transparent border-b-primary drop-shadow-md" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-card border-2 shadow-lg flex items-center justify-center" style={{ borderColor: 'hsl(var(--accent))' }}>
                  <span className="text-2xl">🕋</span>
                </div>
              </div>
            </div>

            <div className="premium-card p-4 text-center w-full max-w-xs">
              <div className="icon-container p-2 mx-auto w-fit mb-2">
                <Compass className="w-5 h-5 text-primary" strokeWidth={1.6} />
              </div>
              <p className="text-3xl font-bold text-primary">{Math.round(qiblaAngle)}°</p>
              <p className="text-xs text-muted-foreground mt-1">{t("কিবলার দিক", "Qibla Direction", "اتجاه القبلة")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="premium-card p-3.5 text-center">
                <div className="icon-container-gold p-1.5 mx-auto w-fit mb-1.5">
                  <MapPin className="w-4 h-4 text-accent" strokeWidth={1.8} />
                </div>
                <p className="text-lg font-bold text-foreground">{distance} km</p>
                <p className="text-[10px] text-muted-foreground">{t("মক্কা থেকে দূরত্ব", "To Makkah", "إلى مكة")}</p>
              </div>
              <div className="premium-card p-3.5 text-center">
                <div className="icon-container p-1.5 mx-auto w-fit mb-1.5">
                  <Navigation className="w-4 h-4 text-primary" strokeWidth={1.8} />
                </div>
                <p className="text-lg font-bold text-foreground">{heading !== null ? `${Math.round(heading)}°` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">{t("আপনার দিক", "Your Heading", "اتجاهك")}</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center max-w-xs">
              {locationName && <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />{locationName}</span>}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
