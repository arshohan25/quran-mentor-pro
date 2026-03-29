export interface PrayerContent {
  arabic: string;
  bengali: string;
  transliteration?: string;
}

export interface PrayerStep {
  step: string;
  stepBn: string;
  content: PrayerContent;
  notes?: { [madhab: string]: string };
}

export interface PrayerInfo {
  name: string;
  nameBn: string;
  nameAr: string;
  rakats: { [madhab: string]: string };
  steps: PrayerStep[];
}

export type Madhab = 'hanafi' | 'shafii' | 'maliki' | 'hanbali';

export const madhabs: { id: Madhab; name: string; nameBn: string }[] = [
  { id: 'hanafi', name: 'Hanafi', nameBn: 'হানাফী' },
  { id: 'shafii', name: "Shafi'i", nameBn: 'শাফেঈ' },
  { id: 'maliki', name: 'Maliki', nameBn: 'মালেকী' },
  { id: 'hanbali', name: 'Hanbali', nameBn: 'হাম্বলী' },
];

export const commonDuas: PrayerContent[] = [
  {
    arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ",
    bengali: "সুবহানাকা আল্লাহুম্মা ওয়া বিহামদিকা, ওয়া তাবারাকাসমুকা, ওয়া তা'আলা জাদ্দুকা, ওয়া লা ইলাহা গাইরুকা।\n\nঅর্থ: হে আল্লাহ! তুমি পবিত্র, তোমার প্রশংসার সাথে, তোমার নাম বরকতময়, তোমার মর্যাদা সর্বোচ্চ, তুমি ছাড়া কোনো ইলাহ নেই।",
    transliteration: "Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruka."
  },
  {
    arabic: "اللَّهُ أَكْبَرُ",
    bengali: "আল্লাহু আকবার\n\nঅর্থ: আল্লাহ সর্বশ্রেষ্ঠ।",
    transliteration: "Allahu Akbar"
  },
  {
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    bengali: "সুবহানা রাব্বিয়াল আযীম\n\nঅর্থ: আমার মহান প্রতিপালক পবিত্র।",
    transliteration: "Subhana Rabbiyal Azeem"
  },
  {
    arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ رَبَّنَا وَلَكَ الْحَمْدُ",
    bengali: "সামি'আল্লাহু লিমান হামিদাহ, রাব্বানা ওয়া লাকাল হামদ\n\nঅর্থ: আল্লাহ তার প্রশংসাকারীর প্রশংসা শোনেন। হে আমাদের প্রভু, সকল প্রশংসা তোমার।",
    transliteration: "Sami'Allahu liman hamidah, Rabbana wa lakal hamd"
  },
  {
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    bengali: "সুবহানা রাব্বিয়াল আ'লা\n\nঅর্থ: আমার সর্বোচ্চ প্রতিপালক পবিত্র।",
    transliteration: "Subhana Rabbiyal A'la"
  },
];

export const tashahhud: PrayerContent = {
  arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
  bengali: "আত্তাহিয়্যাতু লিল্লাহি ওয়াস সালাওয়াতু ওয়াত তাইয়্যিবাতু। আসসালামু আলাইকা আইয়্যুহান নাবিয়্যু ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু। আসসালামু আলাইনা ওয়া আলা ইবাদিল্লাহিস সালিহীন। আশহাদু আল লা ইলাহা ইল্লাল্লাহু ওয়া আশহাদু আন্না মুহাম্মাদান আবদুহু ওয়া রাসুলুহু।\n\nঅর্থ: সকল মৌখিক ইবাদত আল্লাহর জন্য, সকল সালাত ও পবিত্র কর্ম। হে নবী, আপনার উপর শান্তি, আল্লাহর রহমত ও বরকত বর্ষিত হোক। আমাদের উপর এবং আল্লাহর নেক বান্দাদের উপর শান্তি বর্ষিত হোক। আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো ইলাহ নেই এবং মুহাম্মাদ তাঁর বান্দা ও রাসূল।",
  transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibatu. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu al la ilaha illallahu wa ash-hadu anna Muhammadan 'abduhu wa rasuluh."
};

export const durood: PrayerContent = {
  arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
  bengali: "আল্লাহুম্মা সাল্লি আলা মুহাম্মাদিন ওয়া আলা আলি মুহাম্মাদ, কামা সাল্লাইতা আলা ইবরাহীমা ওয়া আলা আলি ইবরাহীম, ইন্নাকা হামীদুম মাজীদ। আল্লাহুম্মা বারিক আলা মুহাম্মাদিন ওয়া আলা আলি মুহাম্মাদ, কামা বারাকতা আলা ইবরাহীমা ওয়া আলা আলি ইবরাহীম, ইন্নাকা হামীদুম মাজীদ।\n\nঅর্থ: হে আল্লাহ! মুহাম্মাদ ও তাঁর বংশধরদের উপর রহমত বর্ষণ কর, যেমন তুমি ইবরাহীম ও তাঁর বংশধরদের উপর রহমত বর্ষণ করেছিলে। নিশ্চয়ই তুমি প্রশংসিত ও মর্যাদাবান।",
  transliteration: "Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad, kama sallayta 'ala Ibrahima wa 'ala aali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala aali Muhammad, kama barakta 'ala Ibrahima wa 'ala aali Ibrahim, innaka Hamidun Majid."
};

export const prayers: PrayerInfo[] = [
  {
    name: "Fajr",
    nameBn: "ফজর",
    nameAr: "الفجر",
    rakats: {
      hanafi: "২ সুন্নাত + ২ ফরজ",
      shafii: "২ সুন্নাত + ২ ফরজ",
      maliki: "২ সুন্নাত + ২ ফরজ",
      hanbali: "২ সুন্নাত + ২ ফরজ",
    },
    steps: [
      {
        step: "Takbir",
        stepBn: "তাকবীর (নিয়ত ও তাকবীরে তাহরীমা)",
        content: commonDuas[1],
        notes: {
          hanafi: "দুই হাত কান পর্যন্ত তুলে তাকবীর বলবে, তারপর নাভির নিচে হাত বাঁধবে।",
          shafii: "দুই হাত কাঁধ পর্যন্ত তুলে তাকবীর বলবে, তারপর বুকের উপর হাত বাঁধবে।",
          maliki: "দুই হাত কাঁধ পর্যন্ত তুলে তাকবীর বলবে, তারপর হাত ছেড়ে দিবে (পাশে রাখবে)।",
          hanbali: "দুই হাত কাঁধ পর্যন্ত তুলে তাকবীর বলবে, তারপর বুকের উপর হাত বাঁধবে।",
        },
      },
      {
        step: "Sana (Opening Dua)",
        stepBn: "সানা (প্রারম্ভিক দোয়া)",
        content: commonDuas[0],
      },
      {
        step: "Ruku",
        stepBn: "রুকু",
        content: commonDuas[2],
        notes: {
          hanafi: "৩ বার 'সুবহানা রাব্বিয়াল আযীম' পড়বে।",
          shafii: "৩ বার 'সুবহানা রাব্বিয়াল আযীম' পড়বে।",
          maliki: "৩ বার 'সুবহানা রাব্বিয়াল আযীম' পড়বে।",
          hanbali: "৩ বার 'সুবহানা রাব্বিয়াল আযীম' পড়বে।",
        },
      },
      {
        step: "Standing from Ruku",
        stepBn: "রুকু থেকে দাঁড়ানো",
        content: commonDuas[3],
      },
      {
        step: "Sajdah",
        stepBn: "সেজদা",
        content: commonDuas[4],
        notes: {
          hanafi: "৩ বার 'সুবহানা রাব্বিয়াল আ'লা' পড়বে। ৭টি অঙ্গের উপর সেজদা করবে।",
          shafii: "৩ বার 'সুবহানা রাব্বিয়াল আ'লা' পড়বে।",
          maliki: "৩ বার 'সুবহানা রাব্বিয়াল আ'লা' পড়বে।",
          hanbali: "৩ বার 'সুবহানা রাব্বিয়াল আ'লা' পড়বে।",
        },
      },
    ],
  },
  {
    name: "Dhuhr",
    nameBn: "যোহর",
    nameAr: "الظهر",
    rakats: {
      hanafi: "৪ সুন্নাত + ৪ ফরজ + ২ সুন্নাত + ২ নফল",
      shafii: "২/৪ সুন্নাত + ৪ ফরজ + ২ সুন্নাত",
      maliki: "৪ ফরজ + ২ সুন্নাত",
      hanbali: "২/৪ সুন্নাত + ৪ ফরজ + ২ সুন্নাত",
    },
    steps: [
      { step: "Takbir", stepBn: "তাকবীর", content: commonDuas[1] },
      { step: "Sana", stepBn: "সানা", content: commonDuas[0] },
      { step: "Ruku", stepBn: "রুকু", content: commonDuas[2] },
      { step: "Standing from Ruku", stepBn: "রুকু থেকে দাঁড়ানো", content: commonDuas[3] },
      { step: "Sajdah", stepBn: "সেজদা", content: commonDuas[4] },
    ],
  },
  {
    name: "Asr",
    nameBn: "আসর",
    nameAr: "العصر",
    rakats: {
      hanafi: "৪ সুন্নাত + ৪ ফরজ",
      shafii: "৪ ফরজ",
      maliki: "৪ ফরজ",
      hanbali: "৪ ফরজ",
    },
    steps: [
      { step: "Takbir", stepBn: "তাকবীর", content: commonDuas[1] },
      { step: "Sana", stepBn: "সানা", content: commonDuas[0] },
      { step: "Ruku", stepBn: "রুকু", content: commonDuas[2] },
      { step: "Standing from Ruku", stepBn: "রুকু থেকে দাঁড়ানো", content: commonDuas[3] },
      { step: "Sajdah", stepBn: "সেজদা", content: commonDuas[4] },
    ],
  },
  {
    name: "Maghrib",
    nameBn: "মাগরিব",
    nameAr: "المغرب",
    rakats: {
      hanafi: "৩ ফরজ + ২ সুন্নাত + ২ নফল",
      shafii: "৩ ফরজ + ২ সুন্নাত",
      maliki: "৩ ফরজ + ২ সুন্নাত",
      hanbali: "৩ ফরজ + ২ সুন্নাত",
    },
    steps: [
      { step: "Takbir", stepBn: "তাকবীর", content: commonDuas[1] },
      { step: "Sana", stepBn: "সানা", content: commonDuas[0] },
      { step: "Ruku", stepBn: "রুকু", content: commonDuas[2] },
      { step: "Standing from Ruku", stepBn: "রুকু থেকে দাঁড়ানো", content: commonDuas[3] },
      { step: "Sajdah", stepBn: "সেজদা", content: commonDuas[4] },
    ],
  },
  {
    name: "Isha",
    nameBn: "এশা",
    nameAr: "العشاء",
    rakats: {
      hanafi: "৪ সুন্নাত + ৪ ফরজ + ২ সুন্নাত + ২ নফল + ৩ বিতর",
      shafii: "৪ ফরজ + ২ সুন্নাত + ৩ বিতর",
      maliki: "৪ ফরজ + ২ সুন্নাত + ১ বিতর",
      hanbali: "৪ ফরজ + ২ সুন্নাত + ৩ বিতর",
    },
    steps: [
      { step: "Takbir", stepBn: "তাকবীর", content: commonDuas[1] },
      { step: "Sana", stepBn: "সানা", content: commonDuas[0] },
      { step: "Ruku", stepBn: "রুকু", content: commonDuas[2] },
      { step: "Standing from Ruku", stepBn: "রুকু থেকে দাঁড়ানো", content: commonDuas[3] },
      { step: "Sajdah", stepBn: "সেজদা", content: commonDuas[4] },
    ],
  },
];

export const qariList = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy", nameBn: "মিশারি রশিদ আল-আফাসি" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", nameBn: "আব্দুল বাসিত (মুরাত্তাল)" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", nameBn: "আব্দুর রহমান আস-সুদাইস" },
  { id: "ar.hudhaify", name: "Ali Al-Hudhaify", nameBn: "আলী আল-হুযাইফী" },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi", nameBn: "মুহাম্মাদ সিদ্দীক আল-মিনশাওয়ী" },
];
