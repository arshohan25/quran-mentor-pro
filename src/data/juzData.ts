export interface JuzInfo {
  number: number;
  name: string;
  nameEn: string;
  nameBn: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export const juzList: JuzInfo[] = [
  { number: 1, name: "آلم", nameEn: "Alif Lam Meem", nameBn: "আলিফ লাম মীম", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { number: 2, name: "سَيَقُولُ", nameEn: "Sayaqul", nameBn: "সাইয়াকুল", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { number: 3, name: "تِلْكَ ٱلرُّسُلُ", nameEn: "Tilkal Rusul", nameBn: "তিলকার রুসুল", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { number: 4, name: "لَن تَنَالُوا", nameEn: "Lan Tanaloo", nameBn: "লান তানালু", startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { number: 5, name: "وَٱلْمُحْصَنَاتُ", nameEn: "Wal Muhsanat", nameBn: "ওয়াল মুহসানাত", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { number: 6, name: "لَا يُحِبُّ ٱللَّهُ", nameEn: "La Yuhibbullah", nameBn: "লা ইউহিব্বুল্লাহ", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { number: 7, name: "وَإِذَا سَمِعُوا", nameEn: "Wa Iza Sami'u", nameBn: "ওয়া ইযা সামিউ", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { number: 8, name: "وَلَوْ أَنَّنَا", nameEn: "Wa Lau Annana", nameBn: "ওয়া লাও আন্নানা", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { number: 9, name: "قَالَ ٱلْمَلَأُ", nameEn: "Qalal Mala'u", nameBn: "কালাল মালাউ", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { number: 10, name: "وَٱعْلَمُوا", nameEn: "Wa A'lamu", nameBn: "ওয়া'লামু", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { number: 11, name: "يَعْتَذِرُونَ", nameEn: "Ya'tazirun", nameBn: "ইয়া'তাযিরুন", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { number: 12, name: "وَمَا مِن دَابَّةٍ", nameEn: "Wa Ma Min Dabbah", nameBn: "ওয়া মা মিন দাব্বাহ", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { number: 13, name: "وَمَا أُبَرِّئُ", nameEn: "Wa Ma Ubarri'u", nameBn: "ওয়া মা উবাররিউ", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { number: 14, name: "رُبَمَا", nameEn: "Rubama", nameBn: "রুবামা", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { number: 15, name: "سُبْحَانَ ٱلَّذِى", nameEn: "Subhanallazi", nameBn: "সুবহানাল্লাযী", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { number: 16, name: "قَالَ أَلَمْ", nameEn: "Qala Alam", nameBn: "কালা আলাম", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { number: 17, name: "ٱقْتَرَبَ لِلنَّاسِ", nameEn: "Iqtaraba", nameBn: "ইকতারাবা", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { number: 18, name: "قَدْ أَفْلَحَ", nameEn: "Qad Aflaha", nameBn: "কাদ আফলাহা", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { number: 19, name: "وَقَالَ ٱلَّذِينَ", nameEn: "Wa Qalallazina", nameBn: "ওয়া কালাল্লাযীনা", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { number: 20, name: "أَمَّنْ خَلَقَ", nameEn: "Amman Khalaq", nameBn: "আম্মান খালাকা", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { number: 21, name: "أُتْلُ مَا أُوحِيَ", nameEn: "Utlu Ma Uhiya", nameBn: "উতলু মা উহিয়া", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { number: 22, name: "وَمَن يَقْنُتْ", nameEn: "Wa Man Yaqnut", nameBn: "ওয়া মাইঁ ইয়াকনুত", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { number: 23, name: "وَمَا لِيَ", nameEn: "Wa Mali", nameBn: "ওয়া মা লিয়া", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { number: 24, name: "فَمَنْ أَظْلَمُ", nameEn: "Faman Azlam", nameBn: "ফামান আযলামু", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { number: 25, name: "إِلَيْهِ يُرَدُّ", nameEn: "Ilaihi Yuraddu", nameBn: "ইলাইহি ইউরাদ্দু", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { number: 26, name: "حم", nameEn: "Ha Meem", nameBn: "হা-মীম", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { number: 27, name: "قَالَ فَمَا خَطْبُكُمْ", nameEn: "Qala Fama Khatbukum", nameBn: "কালা ফামা খাতবুকুম", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { number: 28, name: "قَدْ سَمِعَ ٱللَّهُ", nameEn: "Qad Sami'Allahu", nameBn: "কাদ সামিআল্লাহু", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { number: 29, name: "تَبَارَكَ ٱلَّذِى", nameEn: "Tabarakallazi", nameBn: "তাবারাকাল্লাযী", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { number: 30, name: "عَمَّ يَتَسَاءَلُونَ", nameEn: "Amma Yatasaalun", nameBn: "আম্মা ইয়াতাসাআলুন", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];
