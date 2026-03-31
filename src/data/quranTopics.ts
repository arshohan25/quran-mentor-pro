export interface QuranTopic {
  id: string;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  references: { surah: number; ayah: number }[];
}

export const quranTopics: QuranTopic[] = [
  {
    id: "salah",
    nameBn: "নামাজ",
    nameEn: "Prayer (Salah)",
    nameAr: "الصلاة",
    icon: "🕌",
    references: [
      { surah: 2, ayah: 43 }, { surah: 2, ayah: 238 }, { surah: 4, ayah: 103 },
      { surah: 11, ayah: 114 }, { surah: 17, ayah: 78 }, { surah: 20, ayah: 14 },
      { surah: 29, ayah: 45 }, { surah: 62, ayah: 9 },
    ],
  },
  {
    id: "tawba",
    nameBn: "তওবা",
    nameEn: "Repentance",
    nameAr: "التوبة",
    icon: "🤲",
    references: [
      { surah: 2, ayah: 222 }, { surah: 3, ayah: 135 }, { surah: 4, ayah: 17 },
      { surah: 25, ayah: 70 }, { surah: 39, ayah: 53 }, { surah: 66, ayah: 8 },
    ],
  },
  {
    id: "sabr",
    nameBn: "ধৈর্য",
    nameEn: "Patience",
    nameAr: "الصبر",
    icon: "⏳",
    references: [
      { surah: 2, ayah: 153 }, { surah: 2, ayah: 155 }, { surah: 3, ayah: 200 },
      { surah: 11, ayah: 115 }, { surah: 16, ayah: 127 }, { surah: 39, ayah: 10 },
      { surah: 103, ayah: 3 },
    ],
  },
  {
    id: "tawakkul",
    nameBn: "তাওয়াক্কুল",
    nameEn: "Trust in Allah",
    nameAr: "التوكل",
    icon: "🤝",
    references: [
      { surah: 3, ayah: 159 }, { surah: 5, ayah: 23 }, { surah: 8, ayah: 2 },
      { surah: 14, ayah: 12 }, { surah: 33, ayah: 3 }, { surah: 65, ayah: 3 },
    ],
  },
  {
    id: "shukr",
    nameBn: "কৃতজ্ঞতা",
    nameEn: "Gratitude",
    nameAr: "الشكر",
    icon: "🙏",
    references: [
      { surah: 2, ayah: 152 }, { surah: 14, ayah: 7 }, { surah: 16, ayah: 114 },
      { surah: 27, ayah: 40 }, { surah: 31, ayah: 12 }, { surah: 54, ayah: 35 },
    ],
  },
  {
    id: "jannah",
    nameBn: "জান্নাত",
    nameEn: "Paradise",
    nameAr: "الجنة",
    icon: "🌿",
    references: [
      { surah: 2, ayah: 25 }, { surah: 3, ayah: 133 }, { surah: 9, ayah: 72 },
      { surah: 13, ayah: 35 }, { surah: 47, ayah: 15 }, { surah: 55, ayah: 46 },
      { surah: 56, ayah: 17 },
    ],
  },
  {
    id: "jahannam",
    nameBn: "জাহান্নাম",
    nameEn: "Hellfire",
    nameAr: "جهنم",
    icon: "🔥",
    references: [
      { surah: 2, ayah: 24 }, { surah: 3, ayah: 131 }, { surah: 4, ayah: 56 },
      { surah: 14, ayah: 16 }, { surah: 22, ayah: 19 }, { surah: 67, ayah: 6 },
    ],
  },
  {
    id: "parents",
    nameBn: "পিতামাতা",
    nameEn: "Parents",
    nameAr: "الوالدين",
    icon: "👨‍👩‍👧",
    references: [
      { surah: 2, ayah: 83 }, { surah: 4, ayah: 36 }, { surah: 6, ayah: 151 },
      { surah: 17, ayah: 23 }, { surah: 17, ayah: 24 }, { surah: 29, ayah: 8 },
      { surah: 31, ayah: 14 }, { surah: 46, ayah: 15 },
    ],
  },
  {
    id: "zakat",
    nameBn: "যাকাত",
    nameEn: "Charity (Zakat)",
    nameAr: "الزكاة",
    icon: "💰",
    references: [
      { surah: 2, ayah: 43 }, { surah: 2, ayah: 261 }, { surah: 2, ayah: 267 },
      { surah: 9, ayah: 60 }, { surah: 57, ayah: 18 }, { surah: 64, ayah: 16 },
    ],
  },
  {
    id: "taqwa",
    nameBn: "তাকওয়া",
    nameEn: "God-consciousness",
    nameAr: "التقوى",
    icon: "💎",
    references: [
      { surah: 2, ayah: 197 }, { surah: 3, ayah: 102 }, { surah: 49, ayah: 13 },
      { surah: 59, ayah: 18 }, { surah: 65, ayah: 2 }, { surah: 91, ayah: 8 },
    ],
  },
  {
    id: "death",
    nameBn: "মৃত্যু",
    nameEn: "Death",
    nameAr: "الموت",
    icon: "⚰️",
    references: [
      { surah: 3, ayah: 185 }, { surah: 4, ayah: 78 }, { surah: 21, ayah: 35 },
      { surah: 29, ayah: 57 }, { surah: 50, ayah: 19 }, { surah: 62, ayah: 8 },
    ],
  },
  {
    id: "dua",
    nameBn: "দোয়া",
    nameEn: "Supplication",
    nameAr: "الدعاء",
    icon: "🕊️",
    references: [
      { surah: 2, ayah: 186 }, { surah: 7, ayah: 55 }, { surah: 7, ayah: 56 },
      { surah: 14, ayah: 40 }, { surah: 25, ayah: 74 }, { surah: 40, ayah: 60 },
    ],
  },
  {
    id: "rizq",
    nameBn: "রিযক",
    nameEn: "Provision",
    nameAr: "الرزق",
    icon: "🌾",
    references: [
      { surah: 2, ayah: 212 }, { surah: 11, ayah: 6 }, { surah: 17, ayah: 30 },
      { surah: 29, ayah: 60 }, { surah: 42, ayah: 19 }, { surah: 65, ayah: 3 },
    ],
  },
  {
    id: "iman",
    nameBn: "ঈমান",
    nameEn: "Faith",
    nameAr: "الإيمان",
    icon: "✨",
    references: [
      { surah: 2, ayah: 285 }, { surah: 3, ayah: 173 }, { surah: 8, ayah: 2 },
      { surah: 49, ayah: 7 }, { surah: 49, ayah: 14 }, { surah: 58, ayah: 22 },
    ],
  },
  {
    id: "quran",
    nameBn: "কুরআনের মর্যাদা",
    nameEn: "Virtues of Quran",
    nameAr: "فضائل القرآن",
    icon: "📖",
    references: [
      { surah: 2, ayah: 2 }, { surah: 15, ayah: 9 }, { surah: 17, ayah: 9 },
      { surah: 38, ayah: 29 }, { surah: 56, ayah: 77 }, { surah: 59, ayah: 21 },
    ],
  },
];
