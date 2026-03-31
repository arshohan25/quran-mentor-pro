import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, MapPin, AlertCircle } from "lucide-react";
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
      // @ts-ignore - webkitCompassHeading exists on iOS
      const alpha = e.webkitCompassHeading ?? (e.alpha ? 360 - e.alpha : null);
      if (alpha !== null) setHeading(alpha);
    };

    // @ts-ignore - requestPermission exists on iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // @ts-ignore
      DeviceOrientationEvent.requestPermission().then((r: string) => {
        if (r === "granted") window.addEventListener("deviceorientation", handleOrientation, true);
        else setError(t("কম্পাস পারমিশন দিন", "Grant compass permission", "فعّل إذن البوصلة"));
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
      // If no compass available after 2s, show manual mode
      setTimeout(() => {
        setHeading((prev) => (prev === null ? 0 : prev));
      }, 2000);
    }
  }, [t]);

  useEffect(() => {
    if (permissionGranted) startCompass();
  }, [permissionGranted, startCompass]);

  const needleRotation = heading !== null ? qiblaAngle - heading : qiblaAngle;

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("কিবলা ফাইন্ডার", "Qibla Finder", "مكتشف القبلة")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-8 flex flex-col items-center gap-6">
        {error ? (
          <div className="islamic-card p-6 text-center max-w-sm">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {/* Compass */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-accent/30 shadow-[0_0_40px_hsl(var(--accent)/0.15)]" />
              
              {/* Compass dial */}
              <div
                className="absolute inset-3 rounded-full border-2 border-border bg-card shadow-inner transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
              >
                {/* Cardinal marks */}
                {["N", "E", "S", "W"].map((dir, i) => (
                  <div key={dir} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 90}deg)` }}>
                    <span className={`text-xs font-bold mt-2 ${dir === "N" ? "text-destructive" : "text-muted-foreground"}`}>{dir}</span>
                  </div>
                ))}
                {/* Degree ticks */}
                {Array.from({ length: 72 }, (_, i) => (
                  <div key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 5}deg)` }}>
                    <div className={`mt-1 ${i % 6 === 0 ? "w-0.5 h-3 bg-foreground/40" : "w-px h-2 bg-foreground/20"}`} />
                  </div>
                ))}
              </div>

              {/* Qibla needle */}
              <div
                className="absolute inset-6 flex justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[28px] border-l-transparent border-r-transparent border-b-primary drop-shadow-md" />
                </div>
              </div>

              {/* Center Kaaba icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-card border-2 border-accent shadow-lg flex items-center justify-center">
                  <span className="text-2xl">🕋</span>
                </div>
              </div>
            </div>

            {/* Qibla angle display */}
            <div className="islamic-card p-4 text-center w-full max-w-xs">
              <p className="text-3xl font-bold text-primary">{Math.round(qiblaAngle)}°</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("কিবলার দিক", "Qibla Direction", "اتجاه القبلة")}
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="islamic-card p-3 text-center">
                <MapPin className="w-4 h-4 text-accent mx-auto mb-1" />
                <p className="text-lg font-semibold text-foreground">{distance} km</p>
                <p className="text-[10px] text-muted-foreground">{t("মক্কা থেকে দূরত্ব", "Distance to Makkah", "المسافة إلى مكة")}</p>
              </div>
              <div className="islamic-card p-3 text-center">
                <Navigation className="w-4 h-4 text-accent mx-auto mb-1" />
                <p className="text-lg font-semibold text-foreground">{heading !== null ? `${Math.round(heading)}°` : "—"}</p>
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
