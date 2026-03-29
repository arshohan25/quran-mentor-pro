import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface LocationInfo {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

async function fetchPrayerTimes(lat: number, lng: number): Promise<PrayerTimings> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=2`
  );
  const json = await res.json();
  return json.data.timings;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await res.json();
    return { city: data.city || data.locality || "Unknown", country: data.countryName || "" };
  } catch {
    return { city: "Unknown", country: "" };
  }
}

export function usePrayerTimes() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geo = await reverseGeocode(latitude, longitude);
        setLocation({ latitude, longitude, ...geo });
        setLoadingLocation(false);
      },
      () => {
        // Default to Dhaka
        setLocation({ latitude: 23.8103, longitude: 90.4125, city: "Dhaka", country: "Bangladesh" });
        setLoadingLocation(false);
      }
    );
  }, []);

  const query = useQuery({
    queryKey: ["prayer-times", location?.latitude, location?.longitude],
    queryFn: () => fetchPrayerTimes(location!.latitude, location!.longitude),
    enabled: !!location,
  });

  return { ...query, location, locationError, loadingLocation };
}
