

# দৈনিক আমল — সাপ্তাহিক/মাসিক পরিসংখ্যান চার্ট

## কী যোগ হবে
Progress card-এর নিচে একটি **Statistics** সেকশন — সাপ্তাহিক/মাসিক toggle সহ:

1. **Bar chart**: গত ৭/৩০ দিনে প্রতিদিন কতটি আমল সম্পন্ন হয়েছে (recharts BarChart ব্যবহার করে, HifzProgressChart-এর প্যাটার্ন অনুসরণ)
2. **Summary stats**: মোট সম্পন্ন আমল, গড় প্রতিদিন, সর্বোচ্চ দিন
3. **Top amals list**: কোন আমল সবচেয়ে বেশি দিন করা হয়েছে (top 5)

## ডেটা সোর্স
localStorage-এ ইতোমধ্যে `daily-amal-YYYY-MM-DD` কী দিয়ে completed amal IDs সেভ আছে। গত ৭/৩০ দিনের কী scan করে চার্ট ডেটা তৈরি হবে।

## UI ডিজাইন
- Week/Month toggle (দুইটি pill button)
- Bar chart: X-axis = দিন, Y-axis = completed count, max line = 25
- Summary row: ৩টি stat card (মোট, গড়, সেরা দিন)
- Top amals: ছোট list — আমলের নাম + কতদিন করা হয়েছে

## ফাইল পরিবর্তন
1. **NEW** `src/components/DailyAmalStats.tsx` — চার্ট + stats কম্পোনেন্ট (recharts BarChart, localStorage read)
2. **EDIT** `src/pages/DailyAmalPage.tsx` — Progress card-এর পরে `<DailyAmalStats />` import ও render

