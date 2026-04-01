

# ইনলাইন রেসিটেশন ফিক্স — শুধু মাইক আইকন + ওয়ার্ড রিভিল

## সমস্যা
এখন hidden ayah ক্লিক করলে পুরো row বদলে যায় — আলাদা mic button, progress bar, cancel button, error message সব আসে। ইউজার চান **কোনো বাড়তি UI না আসুক** — শুধু existing mic আইকনে ট্যাপ করলে recording শুরু হবে এবং **ব্লার্ড টেক্সট যেখানে আছে সেখানেই** word-by-word reveal হবে।

## কী করা হবে

### 1. `HifzView.tsx` — row layout অপরিবর্তিত রাখা
- `isReciting` হলেও row-এর layout হুবহু একই থাকবে (mic icon + blurred text)।
- `LiveRecitationCheck` component কে আলাদা card/block হিসেবে render করা বন্ধ।
- পরিবর্তে `useArabicRecitationEngine` hook সরাসরি HifzView-এ ব্যবহার করা হবে।
- Mic আইকনে ক্লিক = `toggleListening()` call।
- Recording চলাকালীন mic আইকন pulse/red হবে (শুধু icon color change)।
- Blurred text-এর জায়গায় word-by-word reveal render হবে — revealed words normal, current word highlighted, বাকি blurred। **কোনো progress bar, cancel button, error text block নেই।**
- ভুল হলে শুধু current word red হবে + beep sound।

### 2. `LiveRecitationCheck.tsx` — অপ্রয়োজনীয় হবে
- এই component আর ব্যবহার হবে না; logic সরাসরি HifzView-এ inline হবে `useArabicRecitationEngine` hook দিয়ে।

### 3. কোনো বাড়তি UI element নেই
- No progress bar
- No cancel button  
- No error text below
- No "last spoken" text
- শুধু: mic icon (existing) + word reveal (existing text position) + error word red color + beep sound

## ফাইল পরিবর্তন
1. **EDIT** `src/components/quran/HifzView.tsx` — `isReciting` branch-এ LiveRecitationCheck সরিয়ে inline word-by-word render; `useArabicRecitationEngine` hook import ও ব্যবহার
2. `src/components/quran/LiveRecitationCheck.tsx` — আর import হবে না (ফাইল রাখা যেতে পারে future use-এ)

