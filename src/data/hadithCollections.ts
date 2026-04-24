export interface HadithCollection {
  id: string; // hadithapi.com slug
  bnName: string;
  enName: string;
  arName: string;
  totalHadith: number;
  description: string;
}

export const HADITH_COLLECTIONS: HadithCollection[] = [
  {
    id: "sahih-bukhari",
    bnName: "সহীহ বুখারী",
    enName: "Sahih Bukhari",
    arName: "صحيح البخاري",
    totalHadith: 7563,
    description: "সবচেয়ে নির্ভরযোগ্য হাদীস সংকলন",
  },
  {
    id: "sahih-muslim",
    bnName: "সহীহ মুসলিম",
    enName: "Sahih Muslim",
    arName: "صحيح مسلم",
    totalHadith: 7470,
    description: "দ্বিতীয় সর্বাধিক নির্ভরযোগ্য সংকলন",
  },
  {
    id: "al-tirmidhi",
    bnName: "জামি‘ আত-তিরমিযী",
    enName: "Jami at-Tirmidhi",
    arName: "جامع الترمذي",
    totalHadith: 3956,
    description: "ফিকহী হাদীসের গুরুত্বপূর্ণ সংকলন",
  },
  {
    id: "abu-dawood",
    bnName: "সুনান আবু দাউদ",
    enName: "Sunan Abu Dawood",
    arName: "سنن أبي داود",
    totalHadith: 5274,
    description: "আহকাম-সংক্রান্ত হাদীস",
  },
  {
    id: "sunan-nasai",
    bnName: "সুনান আন-নাসাঈ",
    enName: "Sunan an-Nasa'i",
    arName: "سنن النسائي",
    totalHadith: 5761,
    description: "অত্যন্ত সংক্ষিপ্ত ও সূক্ষ্ম যাচাইকৃত",
  },
  {
    id: "ibn-e-majah",
    bnName: "সুনান ইবনে মাজাহ",
    enName: "Sunan Ibn Majah",
    arName: "سنن ابن ماجه",
    totalHadith: 4341,
    description: "ছয়টি প্রধান সংকলনের ষষ্ঠ গ্রন্থ",
  },
];
