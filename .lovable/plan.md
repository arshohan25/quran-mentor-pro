# দৈনিক আমল — বার্ষিক হিটম্যাপ

## কী যোগ হবে
`DailyAmalStats` কম্পোনেন্টে চার্টের নিচে একটি **GitHub-style heatmap** — গত ৩৬৫ দিনের আমল ট্র্যাকিং দেখাবে।

## UI ডিজাইন
- সাপ্তাহ কলাম × ৭ দিন সারি (শনি-শুক্র) — ডানদিকে সাম্প্রতিক
- প্রতিটি সেল = ১ দিন, রঙের গাঢ়তা = কতটি আমল সম্পন্ন (০ = ফাঁকা/dim, ২৫ = গাঢ় primary)
- ৪-৫ ধাপের color scale (০, ১-৫, ৬-১২, ১৩-১৯, ২০-২৫)
- মাসের নাম উপরে label হিসেবে
- হিটম্যাপের নিচে color legend
- মোবাইলে horizontally scrollable

## ডেটা সোর্স
localStorage-এর `daily-amal-YYYY-MM-DD` কী থেকে গত ৩৬৫ দিনের ডেটা scan

## ফাইল পরিবর্তন
1. **EDIT** `src/components/DailyAmalStats.tsx` — হিটম্যাপ সেকশন যোগ (Top Amals-এর পরে)
