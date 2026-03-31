import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Dua {
  id: number;
  category: string;
  categoryBn: string;
  categoryAr: string;
  arabic: string;
  transliteration: string;
  bn: string;
  en: string;
  reference: string;
}

const DUAS: Dua[] = [
  // === Quran Verses ===
  { id: 1, category: "Quran", categoryBn: "কুরআনের দোয়া", categoryAr: "أدعية قرآنية", arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", transliteration: "Allahu la ilaha illa huwal hayyul qayyum, la ta'khudhuhu sinatun wa la nawm...", bn: "আল্লাহ, তিনি ছাড়া কোনো ইলাহ নেই। তিনি চিরঞ্জীব, সর্বসত্তার ধারক। তাঁকে তন্দ্রা ও নিদ্রা স্পর্শ করে না। আসমান ও জমিনে যা কিছু আছে সব তাঁর। তাঁর অনুমতি ছাড়া কে তাঁর কাছে সুপারিশ করবে? তিনি জানেন যা তাদের সামনে ও পেছনে আছে। তাঁর জ্ঞানের কিছুই তারা আয়ত্ত করতে পারে না, তিনি যা ইচ্ছা করেন তা ছাড়া। তাঁর কুরসি আসমান ও জমিন পরিব্যাপ্ত। এদের রক্ষণাবেক্ষণ তাঁকে ক্লান্ত করে না। তিনি সুউচ্চ, মহান।", en: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.", reference: "কুরআন ২:২৫৫ (আয়াতুল কুরসি)" },
  { id: 2, category: "Quran", categoryBn: "কুরআনের দোয়া", categoryAr: "أدعية قرآنية", arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar", bn: "হে আমাদের রব, আমাদের দুনিয়ায় কল্যাণ দাও এবং আখিরাতেও কল্যাণ দাও এবং আমাদের জাহান্নামের আযাব থেকে রক্ষা করো", en: "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.", reference: "কুরআন ২:২০১" },
  { id: 3, category: "Quran", categoryBn: "কুরআনের দোয়া", categoryAr: "أدعية قرآنية", arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي", transliteration: "Rabbish-rahli sadri wa yassirli amri wahlul 'uqdatan min lisani yafqahu qawli", bn: "হে আমার রব, আমার বক্ষ প্রশস্ত করে দাও, আমার কাজ সহজ করে দাও এবং আমার জিহ্বার জড়তা দূর করে দাও যাতে তারা আমার কথা বুঝতে পারে", en: "My Lord, expand for me my breast, ease my task for me, and untie the knot from my tongue that they may understand my speech.", reference: "কুরআন ২০:২৫-২৮" },

  // === Parents ===
  { id: 4, category: "Parents", categoryBn: "পিতা-মাতার দোয়া", categoryAr: "دعاء للوالدين", arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", transliteration: "Rabbir-hamhuma kama rabbayani saghira", bn: "হে আমার রব, তাদের উভয়ের প্রতি রহম করো যেভাবে তারা আমাকে শৈশবে লালন-পালন করেছেন", en: "My Lord, have mercy upon them as they brought me up when I was small.", reference: "কুরআন ১৭:২৪" },
  { id: 5, category: "Parents", categoryBn: "পিতা-মাতার দোয়া", categoryAr: "دعاء للوالدين", arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", transliteration: "Rabbigh-firli wa liwalidayya wa lil-mu'minina yawma yaqumul hisab", bn: "হে আমার রব, আমাকে, আমার পিতা-মাতাকে এবং সকল মুমিনকে ক্ষমা করো যেদিন হিসাব কায়েম হবে", en: "My Lord, forgive me and my parents and the believers the Day the account is established.", reference: "কুরআন ১৪:৪১" },

  // === Adhan ===
  { id: 6, category: "Adhan", categoryBn: "আযানের পরের দোয়া", categoryAr: "دعاء بعد الأذان", arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ", transliteration: "Allahumma Rabba hadhihid-da'watit-tammah, was-salatil qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqamam mahmudanil-ladhi wa'adtah", bn: "হে আল্লাহ, এই পরিপূর্ণ আহ্বান ও প্রতিষ্ঠিত নামাজের রব, মুহাম্মাদকে ওসিলা ও মর্যাদা দান করুন এবং তাঁকে সেই প্রশংসিত মাকামে পৌঁছে দিন যার প্রতিশ্রুতি আপনি তাঁকে দিয়েছেন", en: "O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and the virtue, and raise him to the praised station You have promised him.", reference: "বুখারী" },

  // === Salah / Qunoot ===
  { id: 7, category: "Salah", categoryBn: "নামাজের দোয়া", categoryAr: "دعاء الصلاة", arabic: "اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ وَبَارِكْ لِي فِيمَا أَعْطَيْتَ وَقِنِي شَرَّ مَا قَضَيْتَ فَإِنَّكَ تَقْضِي وَلَا يُقْضَىٰ عَلَيْكَ وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ", transliteration: "Allahummah-dini fiman hadayt, wa 'afini fiman 'afayt, wa tawallani fiman tawallayt, wa barik li fima a'tayt, wa qini sharra ma qadayt, fa innaka taqdi wa la yuqda 'alayk, wa innahu la yadhillu man walayt, tabarakta Rabbana wa ta'alayt", bn: "হে আল্লাহ, যাদের তুমি হিদায়াত দিয়েছ তাদের সাথে আমাকেও হিদায়াত দাও, যাদের তুমি নিরাপত্তা দিয়েছ তাদের সাথে আমাকেও নিরাপত্তা দাও, যাদের তুমি অভিভাবকত্ব নিয়েছ তাদের সাথে আমারও অভিভাবকত্ব নাও, যা তুমি দিয়েছ তাতে বরকত দাও, তুমি যা ফয়সালা করেছ তার অনিষ্ট থেকে আমাকে রক্ষা করো", en: "O Allah, guide me among those You have guided, grant me well-being among those You have granted well-being, take me into Your charge among those You have taken into Your charge, bless me in what You have given, and protect me from the evil of what You have decreed.", reference: "তিরমিযী, নাসায়ী (দোয়া কুনূত)" },
  { id: 8, category: "Salah", categoryBn: "নামাজের দোয়া", categoryAr: "دعاء الصلاة", arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ", transliteration: "Rabbana taqabbal minna innaka antas-sami'ul 'alim, wa tub 'alayna innaka antat-tawwabur-rahim", bn: "হে আমাদের রব, আমাদের থেকে কবুল করুন, নিশ্চয় আপনি সর্বশ্রোতা, সর্বজ্ঞ। আমাদের তাওবা কবুল করুন, নিশ্চয় আপনি তাওবা কবুলকারী, দয়ালু", en: "Our Lord, accept from us. Indeed You are the Hearing, the Knowing. And turn to us in mercy; indeed, You are the Accepting of repentance, the Merciful.", reference: "কুরআন ২:১২৭-১২৮" },

  // === Morning ===
  { id: 9, category: "Morning", categoryBn: "সকালের আযকার", categoryAr: "أذكار الصباح", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah", bn: "আমরা সকালে উপনীত হলাম এবং সকালে রাজত্ব আল্লাহর জন্য, সকল প্রশংসা আল্লাহর", en: "We have entered the morning and the kingdom belongs to Allah. All praise is for Allah.", reference: "মুসলিম" },
  { id: 10, category: "Morning", categoryBn: "সকালের আযকার", categoryAr: "أذكار الصباح", arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan nushur", bn: "হে আল্লাহ, তোমার রহমতে সকালে উপনীত হলাম, তোমার রহমতে সন্ধ্যায় উপনীত হই, তোমার ইচ্ছায় বাঁচি ও মরি", en: "O Allah, by Your grace we enter the morning, and by Your grace we enter the evening.", reference: "তিরমিযী" },
  { id: 11, category: "Morning", categoryBn: "সকালের আযকার", categoryAr: "أذكار الصباح", arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq", bn: "আমি আল্লাহর পরিপূর্ণ কালেমাসমূহের আশ্রয় চাই তাঁর সৃষ্টির অনিষ্ট থেকে", en: "I seek refuge in the perfect words of Allah from the evil of what He has created.", reference: "মুসলিম" },

  // === Evening ===
  { id: 12, category: "Evening", categoryBn: "সন্ধ্যার আযকার", categoryAr: "أذكار المساء", arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Amsayna wa amsal mulku lillah walhamdu lillah", bn: "আমরা সন্ধ্যায় উপনীত হলাম এবং সন্ধ্যায় রাজত্ব আল্লাহর জন্য", en: "We have entered the evening and the kingdom belongs to Allah.", reference: "মুসলিম" },
  { id: 13, category: "Evening", categoryBn: "সন্ধ্যার আযকার", categoryAr: "أذكار المساء", arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", transliteration: "Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilaykal masir", bn: "হে আল্লাহ, তোমার রহমতে সন্ধ্যায় উপনীত হলাম, তোমার ইচ্ছায় বাঁচি ও মরি এবং তোমার কাছেই প্রত্যাবর্তন", en: "O Allah, by Your grace we enter the evening. By Your will we live and die, and to You is the return.", reference: "তিরমিযী" },

  // === Food ===
  { id: 14, category: "Food", categoryBn: "খাবারের দোয়া", categoryAr: "دعاء الطعام", arabic: "بِسْمِ اللّٰهِ وَعَلَى بَرَكَةِ اللّٰهِ", transliteration: "Bismillahi wa 'ala barakatillah", bn: "আল্লাহর নামে এবং আল্লাহর বরকতে (শুরু করছি)", en: "In the name of Allah and with the blessings of Allah.", reference: "আবু দাউদ" },
  { id: 15, category: "Food", categoryBn: "খাবারের দোয়া", categoryAr: "دعاء الطعام", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", transliteration: "Alhamdu lillahil ladhi at'amana wa saqana wa ja'alana muslimin", bn: "সকল প্রশংসা আল্লাহর যিনি আমাদের খাওয়ালেন, পান করালেন এবং মুসলিম বানালেন", en: "All praise is for Allah who fed us, gave us drink, and made us Muslims.", reference: "আবু দাউদ, তিরমিযী" },

  // === Sleep ===
  { id: 16, category: "Sleep", categoryBn: "ঘুমের দোয়া", categoryAr: "دعاء النوم", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismika Allahumma amutu wa ahya", bn: "হে আল্লাহ, তোমার নামেই মরি এবং বাঁচি", en: "In Your name, O Allah, I die and I live.", reference: "বুখারী" },
  { id: 17, category: "Sleep", categoryBn: "ঘুমের দোয়া", categoryAr: "دعاء النوم", arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak", bn: "হে আল্লাহ, যেদিন তুমি তোমার বান্দাদের পুনরুত্থিত করবে সেদিন আমাকে তোমার শাস্তি থেকে রক্ষা করো", en: "O Allah, protect me from Your punishment on the day You resurrect Your servants.", reference: "আবু দাউদ" },
  { id: 18, category: "Sleep", categoryBn: "ঘুমের দোয়া", categoryAr: "دعاء النوم", arabic: "اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ", transliteration: "Allahumma bismika ahya wa amut", bn: "হে আল্লাহ, তোমার নামেই বাঁচি এবং মরি (ঘুম থেকে জাগার দোয়া: الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا)", en: "O Allah, in Your name I live and die. (On waking: All praise to Allah who gave us life.)", reference: "বুখারী" },

  // === Travel ===
  { id: 19, category: "Travel", categoryBn: "সফরের দোয়া", categoryAr: "دعاء السفر", arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ", transliteration: "Subhanalladhi sakh-khara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun", bn: "পবিত্র সেই সত্তা যিনি এটিকে আমাদের বশীভূত করে দিয়েছেন, আমরা একে বশ করতে সক্ষম ছিলাম না এবং আমরা অবশ্যই আমাদের রবের কাছে প্রত্যাবর্তনকারী", en: "Glory be to Him who has subjected this to us, and we could not have subdued it, and indeed to our Lord we will return.", reference: "কুরআন ৪৩:১৩-১৪" },

  // === Mosque ===
  { id: 20, category: "Mosque", categoryBn: "মসজিদের দোয়া", categoryAr: "دعاء المسجد", arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", transliteration: "Allahummaf-tah li abwaba rahmatik", bn: "হে আল্লাহ, আমার জন্য তোমার রহমতের দরজা খুলে দাও", en: "O Allah, open for me the doors of Your mercy.", reference: "মুসলিম" },
  { id: 21, category: "Mosque", categoryBn: "মসজিদের দোয়া", categoryAr: "دعاء المسجد", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", transliteration: "Allahumma inni as'aluka min fadlik", bn: "হে আল্লাহ, আমি তোমার অনুগ্রহ প্রার্থনা করি (মসজিদ থেকে বের হওয়ার দোয়া)", en: "O Allah, I ask You from Your bounty. (Dua when leaving the mosque)", reference: "মুসলিম" },

  // === Distress ===
  { id: 22, category: "Distress", categoryBn: "বিপদের দোয়া", categoryAr: "دعاء الكرب", arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", bn: "তুমি ছাড়া কোনো ইলাহ নেই, তুমি পবিত্র, নিশ্চয় আমি যালিমদের অন্তর্ভুক্ত ছিলাম", en: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", reference: "কুরআন ২১:৮৭ (দোয়া ইউনুস)" },
  { id: 23, category: "Distress", categoryBn: "বিপদের দোয়া", categoryAr: "دعاء الكرب", arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", transliteration: "La ilaha illallahul 'azimul halim, la ilaha illallahu Rabbul 'arshil 'azim, la ilaha illallahu Rabbus-samawati wa Rabbul ardi wa Rabbul 'arshil karim", bn: "আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি মহান ও সহনশীল। আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি মহান আরশের রব। আল্লাহ ছাড়া কোনো ইলাহ নেই, আসমানসমূহের রব, জমিনের রব ও সম্মানিত আরশের রব", en: "There is no god but Allah, the Great, the Tolerant. There is no god but Allah, Lord of the Magnificent Throne. There is no god but Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.", reference: "বুখারী, মুসলিম" },
  { id: 24, category: "Distress", categoryBn: "বিপদের দোয়া", categoryAr: "دعاء الكرب", arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", transliteration: "Hasbunallahu wa ni'mal wakil", bn: "আল্লাহই আমাদের জন্য যথেষ্ট এবং তিনি কতই না উত্তম কর্মবিধায়ক", en: "Sufficient for us is Allah, and He is the best Disposer of affairs.", reference: "কুরআন ৩:১৭৩" },

  // === Forgiveness ===
  { id: 25, category: "Forgiveness", categoryBn: "ক্ষমার দোয়া", categoryAr: "دعاء الاستغفار", arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنتَ", transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayya wa abu'u bidhanbi, faghfirli fa innahu la yaghfirudh-dhunuba illa ant", bn: "হে আল্লাহ, তুমি আমার রব, তুমি ছাড়া কোনো ইলাহ নেই, তুমি আমাকে সৃষ্টি করেছ এবং আমি তোমার বান্দা, আমি তোমার ওয়াদা ও প্রতিশ্রুতির উপর সাধ্যমত আছি, আমি আমার কৃতকর্মের অনিষ্ট থেকে তোমার আশ্রয় চাই, আমি আমার প্রতি তোমার নিয়ামত স্বীকার করি এবং আমার গুনাহ স্বীকার করি, তাই আমাকে ক্ষমা করো, কেননা তুমি ছাড়া কেউ গুনাহ ক্ষমা করতে পারে না", en: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I am faithful to my covenant and my promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.", reference: "বুখারী (সাইয়িদুল ইস্তিগফার — সম্পূর্ণ)" },
  { id: 26, category: "Forgiveness", categoryBn: "ক্ষমার দোয়া", categoryAr: "دعاء الاستغفار", arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", transliteration: "Rabbana zalamna anfusana wa il-lam taghfir lana wa tarhamna lanakoonanna minal-khasireen", bn: "হে আমাদের রব, আমরা নিজেদের উপর জুলুম করেছি, তুমি যদি আমাদের ক্ষমা না করো এবং রহম না করো তাহলে অবশ্যই আমরা ক্ষতিগ্রস্তদের অন্তর্ভুক্ত হবো", en: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.", reference: "কুরআন ৭:২৩ (আদম আ. এর দোয়া)" },

  // === Knowledge ===
  { id: 27, category: "Knowledge", categoryBn: "জ্ঞানের দোয়া", categoryAr: "دعاء العلم", arabic: "رَّبِّ زِدْنِي عِلْمًا", transliteration: "Rabbi zidni 'ilma", bn: "হে আমার রব, আমার জ্ঞান বৃদ্ধি করে দাও", en: "My Lord, increase me in knowledge.", reference: "কুরআন ২০:১১৪" },
  { id: 28, category: "Knowledge", categoryBn: "জ্ঞানের দোয়া", categoryAr: "دعاء العلم", arabic: "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا", transliteration: "Allahummam-fa'ni bima 'allamtani wa 'allimni ma yanfa'uni wa zidni 'ilma", bn: "হে আল্লাহ, তুমি আমাকে যা শিখিয়েছ তা দ্বারা আমাকে উপকৃত করো, যা আমার উপকারে আসবে তা আমাকে শেখাও এবং আমার জ্ঞান বৃদ্ধি করো", en: "O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge.", reference: "ইবনে মাজাহ" },

  // === Health ===
  { id: 29, category: "Health", categoryBn: "সুস্থতার দোয়া", categoryAr: "دعاء الشفاء", arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأسَ اشْفِهِ وَأَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا", transliteration: "Allahumma Rabban-nas, adhhibil-ba's, ishfihi wa antash-shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama", bn: "হে আল্লাহ, মানুষের রব, কষ্ট দূর করো, তাকে সুস্থ করো, তুমিই শেফাদানকারী, তোমার শেফা ছাড়া কোনো শেফা নেই, এমন শেফা দাও যা কোনো রোগ অবশিষ্ট রাখে না", en: "O Allah, Lord of the people, remove the difficulty and bring the cure. You are the One who cures. There is no cure except Your cure, a cure that leaves no illness behind.", reference: "বুখারী, মুসলিম" },
  { id: 30, category: "Health", categoryBn: "সুস্থতার দোয়া", categoryAr: "دعاء الشفاء", arabic: "بِسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللَّهُ يَشْفِيكَ بِسْمِ اللَّهِ أَرْقِيكَ", transliteration: "Bismillahi arqika min kulli shay'in yu'dhika, min sharri kulli nafsin aw 'ayni hasidin, Allahu yashfik, bismillahi arqik", bn: "আল্লাহর নামে তোমাকে ঝাড়ফুঁক করছি সবকিছু থেকে যা তোমাকে কষ্ট দেয়, প্রতিটি প্রাণ ও হিংসুকের চোখের অনিষ্ট থেকে, আল্লাহ তোমাকে সুস্থ করুন", en: "In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye. May Allah cure you.", reference: "মুসলিম" },
];

const CATEGORIES = [
  { id: "all", bn: "সব", en: "All", ar: "الكل" },
  { id: "Quran", bn: "কুরআন", en: "Quran", ar: "القرآن" },
  { id: "Salah", bn: "নামাজ", en: "Salah", ar: "الصلاة" },
  { id: "Adhan", bn: "আযান", en: "Adhan", ar: "الأذان" },
  { id: "Parents", bn: "পিতা-মাতা", en: "Parents", ar: "الوالدين" },
  { id: "Morning", bn: "সকাল", en: "Morning", ar: "الصباح" },
  { id: "Evening", bn: "সন্ধ্যা", en: "Evening", ar: "المساء" },
  { id: "Food", bn: "খাবার", en: "Food", ar: "الطعام" },
  { id: "Sleep", bn: "ঘুম", en: "Sleep", ar: "النوم" },
  { id: "Travel", bn: "সফর", en: "Travel", ar: "السفر" },
  { id: "Mosque", bn: "মসজিদ", en: "Mosque", ar: "المسجد" },
  { id: "Distress", bn: "বিপদ", en: "Distress", ar: "الكرب" },
  { id: "Forgiveness", bn: "ক্ষমা", en: "Forgiveness", ar: "الاستغفار" },
  { id: "Knowledge", bn: "জ্ঞান", en: "Knowledge", ar: "العلم" },
  { id: "Health", bn: "সুস্থতা", en: "Health", ar: "الشفاء" },
];

export default function DuaPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("dua-favorites") || "[]"); } catch { return []; }
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("dua-favorites", JSON.stringify(next));
      return next;
    });
  };

  const filtered = DUAS.filter((d) => {
    if (activeCategory !== "all" && d.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.arabic.includes(q) || d.bn.toLowerCase().includes(q) || d.en.toLowerCase().includes(q) || d.transliteration.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("দোয়া ও যিকর", "Duas & Azkar", "الأدعية والأذكار")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("দোয়া খুঁজুন...", "Search duas...", "ابحث عن دعاء...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Category pills */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-accent/40"
                }`}
              >
                {language === "bn" ? cat.bn : language === "ar" ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Duas list */}
        <div className="space-y-3">
          {filtered.map((dua) => (
            <div key={dua.id} className="islamic-card p-4 space-y-3">
              {/* Category badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {language === "bn" ? dua.categoryBn : language === "ar" ? dua.categoryAr : dua.category}
                </span>
                <button onClick={() => toggleFavorite(dua.id)} className="p-1 transition-colors">
                  <Heart className={`w-4 h-4 ${favorites.includes(dua.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                </button>
              </div>

              {/* Arabic text */}
              <p className="font-arabic text-xl leading-[2.2] text-foreground">{dua.arabic}</p>

              {/* Transliteration */}
              <p className="text-xs text-accent italic">{dua.transliteration}</p>

              {/* Translation */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "bn" ? dua.bn : dua.en}
              </p>

              {/* Reference */}
              <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-2">
                📖 {dua.reference}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {t("কোনো দোয়া পাওয়া যায়নি", "No duas found", "لم يتم العثور على أدعية")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
