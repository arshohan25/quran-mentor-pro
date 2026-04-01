
## লক্ষ্য
মাইক্রোফোন যেন আলাদা বড় বক্সে না এসে **আয়াত লাইনের ইনলাইন mic আইকন** থেকে চালু/বন্ধ হয়, এবং একই লাইনে শব্দ-শব্দ রিভিল + ভুল হলে রেড মার্ক + সতর্ক সাউন্ড কাজ করে। সাথে আরবি ট্র্যাকিংকে বেশি tolerant ও dynamic করা।

## সমস্যা নির্ণয়
- `HifzView.tsx` এখন hidden ayah ক্লিক করলে পুরো row বদলে বড় `LiveRecitationCheck` কার্ড দেখায় (এটাই আপনি চান না)।
- `LiveRecitationCheck.tsx` এ final transcript processing এখনও repeat/duplicate token case-এ mismatch তৈরি করে।
- matching এখনো যথেষ্ট robust না (accent/weak voice/fuzzy উচ্চারণে fail করছে)।
- **Do I know what the issue is?** হ্যাঁ।

## ইমপ্লিমেন্টেশন প্ল্যান
1. **Inline Recitation UX (No separate card)**
   - `HifzView.tsx` এ hidden ayah row-এর inline `Mic` আইকনকে primary trigger করা হবে।
   - mic চাপলে একই লাইনে recitation mode চালু হবে; বড় centered mic/cancel UI সরিয়ে ফেলা হবে।
   - word reveal, current target, error state সব একই ayah row-এর ভিতরে render হবে।

2. **Advanced Arabic Tracking Engine**
   - `arabicUtils.ts` এ matcher upgrade:
     - stronger normalization (existing + consistency pass),
     - phonetic confusion mapping,
     - light affix handling,
     - edit-distance similarity scoring।
   - `isArabicWordMatch` কে score-based করা হবে (strict boolean না), dynamic threshold সহ।

3. **Dynamic/Assist Matching Mode**
   - তিনটি sensitivity mode যোগ: `Strict / Balanced / Assist` (default: Balanced)।
   - Assist mode weak/unclear voice এর জন্য বেশি tolerant threshold ব্যবহার করবে।
   - ছোট শব্দে strict, বড় শব্দে lenient threshold — dynamic scaling।

4. **Speech Result Processing Fix**
   - final results থেকে only new tokens process করার জন্য dedupe strategy (result index + token history)।
   - `maxAlternatives` ব্যবহার করে best candidate বাছাই।
   - duplicate/previously matched token হলে ignore (false error কমাতে)।
   - beep only confirmed mismatch এ (rapid ভুল beep loop বন্ধ)।

5. **Inline Feedback & Flow**
   - same line-এ:
     - revealed words normal,
     - current word highlight,
     - wrong target red mark,
     - micro progress indicator।
   - correct word বললে সঙ্গে সঙ্গে reveal advance; ভুল হলে সামনে যাবে না।

6. **Hifz Integration Stability**
   - এক সময়ে একটিই active recitation row।
   - stop/cancel/restart এ clean state reset।
   - complete হলে auto unhide + memorized mark (current behavior রেখে stable করা)।

## টেকনিক্যাল ডিটেইলস
```text
Mic click (inline row)
 -> start speech session
 -> on each NEW final token:
    bestScore = max(score(token, expectedWord), alternatives)
    if bestScore >= threshold(mode, wordLength):
       reveal++
       clear error
    else if not duplicate/old token:
       set errorIndex(current)
       play warning beep (cooldown + confirmation)
 -> when reveal == totalWords:
    stop session
    complete callback
```

## ফাইল পরিবর্তন (পরবর্তী ইমপ্লিমেন্টে)
- `src/components/quran/HifzView.tsx` (inline mic trigger + row-level recitation rendering)
- `src/components/quran/LiveRecitationCheck.tsx` (card থেকে inline engine/UI refactor)
- `src/utils/arabicUtils.ts` (advanced dynamic Arabic matcher)
- (প্রয়োজনে) `src/hooks/useArabicRecitationEngine.ts` (logic আলাদা করে maintainable করা)

## ভেরিফিকেশন প্ল্যান
- mobile viewport (384x655) এ inline mic থেকে শুরু হচ্ছে কিনা।
- large popup/card না এসে একই লাইনে reveal হচ্ছে কিনা।
- ভুল শব্দে red + beep + block, সঠিক বললে unblock।
- weak voice test এ Assist mode এ recognition উন্নত হচ্ছে কিনা।
- Surah Al-Fatiha full pass: no random beep loop, no stalled progress।
