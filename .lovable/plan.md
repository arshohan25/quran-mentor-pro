

# ইনলাইন রেসিটেশন ফিক্স — এক ট্যাপে শুরু + সেনসিটিভিটি সেটিংস

## সমস্যা
1. **দুইবার ট্যাপ লাগছে**: Hidden ayah-এ mic ক্লিক করলে `startRecitation()` শুধু `activeRecitationAyah` সেট করে, কিন্তু listening শুরু করে না। তারপর আবার mic চাপতে হয় `toggleListening()` call করতে — এটাই "দুই বার চাপ" সমস্যা।
2. **সেনসিটিভিটি সেটিংস নেই**: mode হার্ডকোডেড `"balanced"` — ইউজার বদলাতে পারে না।

## সমাধান

### 1. এক ট্যাপে listening শুরু (`HifzView.tsx`)
- `startRecitation()` এ `setActiveRecitationAyah()` সেট করার পর, `useEffect` দিয়ে যখন `activeRecitationAyah` বদলায় এবং `recitationAyahText` পাওয়া যায়, তখন auto `startListening()` call করা হবে।
- ফলে hidden ayah-এ একবার ট্যাপ = সরাসরি recording শুরু।

### 2. সেনসিটিভিটি সেটিংস (`HifzView.tsx`)
- Header-এ একটি ছোট settings icon যোগ করা হবে (existing `ReadingSettings` pattern follow করে)।
- তিনটি mode: **Strict** (কড়া), **Balanced** (মাঝামাঝি), **Assist** (সহজ)।
- `localStorage` এ সেভ থাকবে, default `"balanced"`।
- এই mode `useArabicRecitationEngine` hook-এ pass হবে।

### 3. Recitation engine-এ mode পরিবর্তন সাপোর্ট
- `useArabicRecitationEngine` already `mode` parameter নেয় — শুধু HifzView থেকে dynamic value pass করলেই হবে।

## ফাইল পরিবর্তন
1. **EDIT** `src/components/quran/HifzView.tsx`
   - `startRecitation` → auto-start listening via useEffect
   - Sensitivity mode state + localStorage persist
   - Header-এ mode selector (ToggleGroup বা DropdownMenu)
   - `useArabicRecitationEngine(recitationAyahText, selectedMode, handleRecitationComplete)`

