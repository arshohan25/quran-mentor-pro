

# নামাজের অ্যালার্ম + তাজবীদ কালার কোডিং

## ১. নামাজের অ্যালার্ম/নোটিফিকেশন

Browser Notification API ব্যবহার করে নামাজের সময় হলে নোটিফিকেশন দেখাবে।

### ফাইল পরিবর্তন

**`src/hooks/usePrayerAlarm.ts`** (নতুন)
- localStorage-এ কোন কোন ওয়াক্তের অ্যালার্ম চালু সেটা সেভ করবে (`{ Fajr: true, Dhuhr: true, ... }`)
- `Notification.requestPermission()` দিয়ে পারমিশন নেবে
- `setInterval` (প্রতি ৩০ সেকেন্ডে চেক) — বর্তমান সময় কোনো ওয়াক্তের সাথে মিললে `new Notification(...)` দেখাবে
- একই ওয়াক্তে দুইবার যেন নোটিফিকেশন না আসে সেজন্য `lastNotified` ট্র্যাক করবে
- অডিও অ্যালার্ম: একটি ছোট আযানের সাউন্ড প্লে করবে (HTML5 Audio)

**`src/pages/PrayerTimesPage.tsx`** (আপডেট)
- প্রতিটি নামাজের পাশে Bell/BellOff টগল বাটন যোগ করবে
- উপরে "Enable Notifications" বাটন — পারমিশন না থাকলে দেখাবে
- অ্যালার্ম অন/অফ স্টেট `usePrayerAlarm` থেকে আসবে

### ডেটা স্ট্রাকচার (localStorage)
```json
{
  "prayerAlarms": {
    "Fajr": true, "Dhuhr": true, "Asr": true, "Maghrib": true, "Isha": true
  },
  "lastNotifiedPrayer": "Fajr-2026-03-29"
}
```

---

## ২. তাজবীদ কালার কোডিং

আরবি টেক্সটে তাজবীদের নিয়ম অনুযায়ী হরফ/চিহ্ন রঙিন করা হবে। Client-side regex দিয়ে আরবি ক্যারেক্টার ম্যাচ করে `<span>` র‍্যাপ করবে।

### তাজবীদ রুল ও কালার ম্যাপ

| তাজবীদ নিয়ম | কালার | ম্যাচ প্যাটার্ন |
|---|---|---|
| গুন্নাহ (নাসালাইজেশন) | `#FF7F27` কমলা | নুন সাকিন/তানবীন + ইদগাম/ইখফা হরফ |
| ইখফা | `#D946EF` বেগুনি | নুন সাকিন + ইখফা হরফের আগে |
| ইদগাম | `#0EA5E9` নীল | নুন সাকিন + ইদগাম হরফ (ي ن م و ل ر) |
| ইকলাব | `#22C55E` সবুজ | নুন সাকিন + ب |
| কলকলা | `#EF4444` লাল | قطب جد সাকিন অবস্থায় |
| মদ্দ (দীর্ঘ) | `#3B82F6` নীল | মদ্দ চিহ্ন (ٓ) বা আলিফ মদ্দ |

### ফাইল পরিবর্তন

**`src/utils/tajweed.ts`** (নতুন)
- `applyTajweedColors(arabicText: string): string` — আরবি টেক্সট নিয়ে তাজবীদ রুল অনুযায়ী `<span style="color:...">` দিয়ে মার্কআপ রিটার্ন করবে
- রেজেক্স-ভিত্তিক ম্যাচিং — ১০০% নির্ভুল না হলেও প্রধান তাজবীদ নিয়মগুলো কভার করবে

**`src/components/TajweedText.tsx`** (নতুন)
- `dangerouslySetInnerHTML` দিয়ে কালার-কোডেড আরবি রেন্ডার করবে
- তাজবীদ মোড টগল বাটন — ইউজার চাইলে বন্ধ/চালু করতে পারবে
- নিচে একটি ছোট legend (কোন রং = কোন নিয়ম)

**`src/pages/QuranPage.tsx`** (আপডেট)
- আয়াতের আরবি টেক্সটে `TajweedText` কম্পোনেন্ট ব্যবহার করবে
- হেডারে তাজবীদ on/off টগল বাটন যোগ

---

## ফাইল সামারি

| ফাইল | পরিবর্তন |
|---|---|
| `src/hooks/usePrayerAlarm.ts` | নতুন — Notification API + localStorage alarm state |
| `src/utils/tajweed.ts` | নতুন — Arabic tajweed regex color mapping |
| `src/components/TajweedText.tsx` | নতুন — Colored Arabic text + legend |
| `src/pages/PrayerTimesPage.tsx` | Bell toggle per prayer + notification permission |
| `src/pages/QuranPage.tsx` | TajweedText component + toggle button |

