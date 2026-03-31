

# সব জায়গা থেকে স্ক্রলবার সরানো

## সমাধান

সবচেয়ে সহজ ও কার্যকর উপায়: `ScrollArea` component-এ globally `scrollbar-hide` class যোগ করা — তাহলে পুরো অ্যাপ থেকে স্ক্রলবার সরে যাবে।

### পরিবর্তন

**১টি ফাইল:** `src/components/ui/scroll-area.tsx`
- `ScrollAreaPrimitive.Viewport` এ `scrollbar-hide` class যোগ
- `ScrollBar` component-কে default হিসেবে hidden করা (thumb invisible)

এছাড়া `overflow-auto`/`overflow-x-auto` ব্যবহার করা জায়গাগুলোতে `scrollbar-hide` যোগ:
- `src/pages/PrayerPage.tsx` — TabsList এ already আছে `scrollbar-hide`
- `src/components/ui/sidebar.tsx` — `overflow-auto` → add `scrollbar-hide`
- `src/components/ui/command.tsx` — `overflow-y-auto` → add `scrollbar-hide`
- `src/components/ui/table.tsx` — `overflow-auto` → add `scrollbar-hide`

মোট ~৪টি ফাইলে ছোট class addition।

