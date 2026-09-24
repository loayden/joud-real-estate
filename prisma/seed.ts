import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const regions = [
  {
    nameAr: "القاهرة",
    nameEn: "Cairo",
    slug: "cairo",
    code: "CAI",
    isActive: true,
    sortOrder: 1,
  },
  {
    nameAr: "الجيزة",
    nameEn: "Giza",
    slug: "giza",
    code: "GIZ",
    isActive: true,
    sortOrder: 2,
  },
  {
    nameAr: "الإسكندرية",
    nameEn: "Alexandria",
    slug: "alexandria",
    code: "ALX",
    isActive: true,
    sortOrder: 3,
  },
  {
    nameAr: "القاهرة الجديدة",
    nameEn: "New Cairo",
    slug: "new-cairo",
    code: "NCA",
    isActive: true,
    sortOrder: 4,
  },
  {
    nameAr: "العاصمة الإدارية الجديدة",
    nameEn: "New Administrative Capital",
    slug: "new-administrative-capital",
    code: "NAC",
    isActive: true,
    sortOrder: 5,
  },
  {
    nameAr: "مدينة الشيخ زايد",
    nameEn: "Sheikh Zayed",
    slug: "sheikh-zayed",
    code: "SHZ",
    isActive: true,
    sortOrder: 6,
  },
  {
    nameAr: "مدينة 6 أكتوبر",
    nameEn: "6th October",
    slug: "6th-october",
    code: "OCT",
    isActive: true,
    sortOrder: 7,
  },
  {
    nameAr: "الساحل الشمالي",
    nameEn: "North Coast",
    slug: "north-coast",
    code: "NCO",
    isActive: true,
    sortOrder: 8,
  },
  {
    nameAr: "العين السخنة",
    nameEn: "Ain Sokhna",
    slug: "ain-sokhna",
    code: "ASK",
    isActive: true,
    sortOrder: 9,
  },
  {
    nameAr: "الدلتا",
    nameEn: "Delta",
    slug: "delta",
    code: "DLT",
    isActive: true,
    sortOrder: 10,
  },
  {
    nameAr: "المنصورة",
    nameEn: "Mansoura",
    slug: "mansoura",
    code: "MAN",
    isActive: true,
    sortOrder: 11,
  },
  {
    nameAr: "طنطا",
    nameEn: "Tanta",
    slug: "tanta",
    code: "TAN",
    isActive: true,
    sortOrder: 12,
  },
  {
    nameAr: "أسيوط",
    nameEn: "Assiut",
    slug: "assiut",
    code: "AST",
    isActive: true,
    sortOrder: 13,
  },
  {
    nameAr: "الأقصر",
    nameEn: "Luxor",
    slug: "luxor",
    code: "LUX",
    isActive: true,
    sortOrder: 14,
  },
  {
    nameAr: "أسوان",
    nameEn: "Aswan",
    slug: "aswan",
    code: "ASW",
    isActive: true,
    sortOrder: 15,
  },
  {
    nameAr: "الغردقة",
    nameEn: "Hurghada",
    slug: "hurghada",
    code: "HRG",
    isActive: true,
    sortOrder: 16,
  },
  {
    nameAr: "الفيوم",
    nameEn: "Fayoum",
    slug: "fayoum",
    code: "FAY",
    isActive: true,
    sortOrder: 17,
  },
  {
    nameAr: "بني سويف",
    nameEn: "Beni Suef",
    slug: "beni-suef",
    code: "BNS",
    isActive: true,
    sortOrder: 18,
  },
  {
    nameAr: "المنيا",
    nameEn: "Minya",
    slug: "minya",
    code: "MIN",
    isActive: true,
    sortOrder: 19,
  },
  {
    nameAr: "قليوبية",
    nameEn: "Qalyubia",
    slug: "qalyubia",
    code: "QLY",
    isActive: true,
    sortOrder: 20,
  },
];

const citiesByRegion = {
  cairo: [
    {
      nameAr: "مصر الجديدة",
      nameEn: "Heliopolis",
      slug: "heliopolis",
      latitude: 30.0876,
      longitude: 31.3271,
      sortOrder: 1,
    },
    {
      nameAr: "المهندسين",
      nameEn: "Mohandessin",
      slug: "mohandessin",
      latitude: 30.0561,
      longitude: 31.2041,
      sortOrder: 2,
    },
    {
      nameAr: "الزمالك",
      nameEn: "Zamalek",
      slug: "zamalek",
      latitude: 30.0522,
      longitude: 31.2186,
      sortOrder: 3,
    },
    {
      nameAr: "وسط البلد",
      nameEn: "Downtown Cairo",
      slug: "downtown-cairo",
      latitude: 30.0444,
      longitude: 31.2357,
      sortOrder: 4,
    },
    {
      nameAr: "مدينة نصر",
      nameEn: "Nasr City",
      slug: "nasr-city",
      latitude: 30.0588,
      longitude: 31.3441,
      sortOrder: 5,
    },
    {
      nameAr: "المعادي",
      nameEn: "Maadi",
      slug: "maadi",
      latitude: 29.9602,
      longitude: 31.2571,
      sortOrder: 6,
    },
    {
      nameAr: "حلوان",
      nameEn: "Helwan",
      slug: "helwan",
      latitude: 29.8419,
      longitude: 31.3338,
      sortOrder: 7,
    },
    {
      nameAr: "شبرا",
      nameEn: "Shubra",
      slug: "shubra",
      latitude: 30.0715,
      longitude: 31.2441,
      sortOrder: 8,
    },
    {
      nameAr: "البساتين",
      nameEn: "Basatin",
      slug: "basatin",
      latitude: 30.0219,
      longitude: 31.2719,
      sortOrder: 9,
    },
    {
      nameAr: "تولومبات",
      nameEn: "Tullumbat",
      slug: "tullumbat",
      latitude: 30.0622,
      longitude: 31.2878,
      sortOrder: 10,
    },
    {
      nameAr: "العباسية",
      nameEn: "Abbassia",
      slug: "abbassia",
      latitude: 30.0792,
      longitude: 31.2811,
      sortOrder: 11,
    },
    {
      nameAr: "المنيل",
      nameEn: "Manial",
      slug: "manial",
      latitude: 30.0289,
      longitude: 31.2369,
      sortOrder: 12,
    },
    {
      nameAr: "جاردن سيتي",
      nameEn: "Garden City",
      slug: "garden-city",
      latitude: 30.0319,
      longitude: 31.2247,
      sortOrder: 13,
    },
    {
      nameAr: "الدقي",
      nameEn: "Dokki",
      slug: "dokki",
      latitude: 30.0381,
      longitude: 31.2117,
      sortOrder: 14,
    },
    {
      nameAr: "الacroبات",
      nameEn: "Akhbarak",
      slug: "akhbarak",
      latitude: 30.0492,
      longitude: 31.2117,
      sortOrder: 15,
    },
  ],
  giza: [
    {
      nameAr: "الهرم",
      nameEn: "Pyramids",
      slug: "pyramids",
      latitude: 29.987,
      longitude: 31.132,
      sortOrder: 1,
    },
    {
      nameAr: "فيصل",
      nameEn: "Faisal",
      slug: "faisal",
      latitude: 29.9819,
      longitude: 31.1497,
      sortOrder: 2,
    },
    {
      nameAr: "الوراق",
      nameEn: "El Warraq",
      slug: "el-warraq",
      latitude: 30.0281,
      longitude: 31.1764,
      sortOrder: 3,
    },
    {
      nameAr: "العجوزة",
      nameEn: "Agouza",
      slug: "agouza",
      latitude: 30.0539,
      longitude: 31.2017,
      sortOrder: 4,
    },
    {
      nameAr: "إمبابة",
      nameEn: "Imbaba",
      slug: "imbaba",
      latitude: 30.0764,
      longitude: 31.2081,
      sortOrder: 5,
    },
    {
      nameAr: "الطالبية",
      nameEn: "Talbiya",
      slug: "talbiya",
      latitude: 30.0364,
      longitude: 31.1764,
      sortOrder: 6,
    },
    {
      nameAr: "الوريمال",
      nameEn: "Orouba",
      slug: "orouba",
      latitude: 30.0253,
      longitude: 31.1547,
      sortOrder: 7,
    },
    {
      nameAr: "كرداسة",
      nameEn: "Kardasa",
      slug: "kardasa",
      latitude: 30.0686,
      longitude: 31.1186,
      sortOrder: 8,
    },
    {
      nameAr: "أبو رواش",
      nameEn: "Abu Rawash",
      slug: "abu-rawash",
      latitude: 30.0653,
      longitude: 31.0286,
      sortOrder: 9,
    },
    {
      nameAr: "الصف",
      nameEn: "Saf",
      slug: "saf",
      latitude: 29.9178,
      longitude: 31.1547,
      sortOrder: 10,
    },
  ],
  alexandria: [
    {
      nameAr: "سيدي جابر",
      nameEn: "Sidi Gaber",
      slug: "sidi-gaber",
      latitude: 31.2117,
      longitude: 29.9517,
      sortOrder: 1,
    },
    {
      nameAr: "سموحة",
      nameEn: "Smouha",
      slug: "smouha",
      latitude: 31.2164,
      longitude: 29.9528,
      sortOrder: 2,
    },
    {
      nameAr: "المنشية",
      nameEn: "Al Mamsha",
      slug: "al-mamsha",
      latitude: 31.2539,
      longitude: 29.9917,
      sortOrder: 3,
    },
    {
      nameAr: "العصافرة",
      nameEn: "Asafra",
      slug: "asafra",
      latitude: 31.2217,
      longitude: 29.9664,
      sortOrder: 4,
    },
    {
      nameAr: "كليوباترا",
      nameEn: "Cleopatra",
      slug: "cleopatra",
      latitude: 31.2264,
      longitude: 29.9717,
      sortOrder: 5,
    },
    {
      nameAr: "الجمرك",
      nameEn: "Al Gomrok",
      slug: "al-gomrok",
      latitude: 31.2064,
      longitude: 29.9064,
      sortOrder: 6,
    },
    {
      nameAr: "المنتزه",
      nameEn: "Montaza",
      slug: "montaza",
      latitude: 31.2817,
      longitude: 30.0164,
      sortOrder: 7,
    },
    {
      nameAr: "ال Astro",
      nameEn: "Stanley",
      slug: "stanley",
      latitude: 31.2364,
      longitude: 29.9964,
      sortOrder: 8,
    },
    {
      nameAr: "شارع فؤاد",
      nameEn: "Fouad Street",
      slug: "fouad-street",
      latitude: 31.2017,
      longitude: 29.9164,
      sortOrder: 9,
    },
  ],
  "new-cairo": [
    {
      nameAr: "التجمع الخامس",
      nameEn: "Fifth Settlement",
      slug: "fifth-settlement",
      latitude: 30.0281,
      longitude: 31.4681,
      sortOrder: 1,
    },
    {
      nameAr: "التجمع الثالث",
      nameEn: "Third Settlement",
      slug: "third-settlement",
      latitude: 30.0364,
      longitude: 31.4364,
      sortOrder: 2,
    },
    {
      nameAr: "مدينة الإصلاح",
      nameEn: "Rehab City",
      slug: "rehab-city",
      latitude: 30.0553,
      longitude: 31.4764,
      sortOrder: 3,
    },
    {
      nameAr: "أمaya",
      nameEn: "Amaya",
      slug: "amaya",
      latitude: 30.0464,
      longitude: 31.4564,
      sortOrder: 4,
    },
    {
      nameAr: "الآي سي سي",
      nameEn: "ICC",
      slug: "icc",
      latitude: 30.0217,
      longitude: 31.4581,
      sortOrder: 5,
    },
    {
      nameAr: "جيه دبليو ماريوت",
      nameEn: "JW Marriott",
      slug: "jw-marriott",
      latitude: 30.0317,
      longitude: 31.4681,
      sortOrder: 6,
    },
  ],
  "new-administrative-capital": [
    {
      nameAr: "المنطقة الإدارية",
      nameEn: "Administrative District",
      slug: "administrative-district",
      latitude: 30.0074,
      longitude: 31.7669,
      sortOrder: 1,
    },
    {
      nameAr: "المنطقة الحيوية",
      nameEn: "Vital District",
      slug: "vital-district",
      latitude: 30.0024,
      longitude: 31.7569,
      sortOrder: 2,
    },
    {
      nameAr: "المنطقة السكنية",
      nameEn: "Residential District",
      slug: "residential-district",
      latitude: 29.9974,
      longitude: 31.7469,
      sortOrder: 3,
    },
    {
      nameAr: "المنطقة الراقية",
      nameEn: "R8 District",
      slug: "r8-district",
      latitude: 30.0124,
      longitude: 31.7769,
      sortOrder: 4,
    },
  ],
  "sheikh-zayed": [
    {
      nameAr: "المحور",
      nameEn: "Al Mohandessin",
      slug: "sz-al-mohandessin",
      latitude: 30.0217,
      longitude: 31.0117,
      sortOrder: 1,
    },
    {
      nameAr: "الحي الثاني",
      nameEn: "2nd District",
      slug: "sz-2nd-district",
      latitude: 30.0117,
      longitude: 31.0217,
      sortOrder: 2,
    },
    {
      nameAr: "الحي الخامس",
      nameEn: "5th District",
      slug: "sz-5th-district",
      latitude: 30.0017,
      longitude: 31.0317,
      sortOrder: 3,
    },
    {
      nameAr: "زهاء",
      nameEn: "Zahraa",
      slug: "sz-zahraa",
      latitude: 30.0317,
      longitude: 31.0017,
      sortOrder: 4,
    },
    {
      nameAr: "الحي السابع",
      nameEn: "Upper Egypt",
      slug: "sz-upper-egypt",
      latitude: 29.9917,
      longitude: 31.0117,
      sortOrder: 5,
    },
  ],
  "6th-october": [
    {
      nameAr: "المستثمرين",
      nameEn: "Investors",
      slug: "investors",
      latitude: 29.9717,
      longitude: 31.0117,
      sortOrder: 1,
    },
    {
      nameAr: "الحي الأول",
      nameEn: "1st District",
      slug: "oct-1st-district",
      latitude: 29.9817,
      longitude: 31.0217,
      sortOrder: 2,
    },
    {
      nameAr: "الحي الثالث",
      nameEn: "3rd District",
      slug: "oct-3rd-district",
      latitude: 29.9617,
      longitude: 31.0317,
      sortOrder: 3,
    },
    {
      nameAr: "الحي السابع",
      nameEn: "7th District",
      slug: "oct-7th-district",
      latitude: 29.9517,
      longitude: 31.0417,
      sortOrder: 4,
    },
    {
      nameAr: "الحياة",
      nameEn: "Hay El Nahda",
      slug: "hay-el-nahda",
      latitude: 29.9417,
      longitude: 31.0517,
      sortOrder: 5,
    },
    {
      nameAr: "الجيز الجديدة",
      nameEn: "New Giza",
      slug: "new-giza",
      latitude: 29.9317,
      longitude: 31.0617,
      sortOrder: 6,
    },
  ],
  "north-coast": [
    {
      nameAr: "مرسى مطروح",
      nameEn: "Marsa Matrouh",
      slug: "marsa-matrouh",
      latitude: 31.3543,
      longitude: 27.2453,
      sortOrder: 1,
    },
    {
      nameAr: "الجونة",
      nameEn: "El Gouna",
      slug: "el-gouna",
      latitude: 27.3983,
      longitude: 33.6763,
      sortOrder: 2,
    },
    {
      nameAr: "سيدي عبد الرحمن",
      nameEn: "Sidi Abdel Rahman",
      slug: "sidi-abdel-rahman",
      latitude: 31.0167,
      longitude: 28.4333,
      sortOrder: 3,
    },
    {
      nameAr: "الحمامات",
      nameEn: "El Hamma",
      slug: "el-hamma",
      latitude: 30.8333,
      longitude: 28.9167,
      sortOrder: 4,
    },
    {
      nameAr: " marina",
      nameEn: "Marina",
      slug: "marina",
      latitude: 30.9517,
      longitude: 28.8317,
      sortOrder: 5,
    },
    {
      nameAr: "هايد بارك",
      nameEn: "Hyde Park",
      slug: "hyde-park",
      latitude: 30.9017,
      longitude: 28.7817,
      sortOrder: 6,
    },
    {
      nameAr: "العلمين الجنوبية",
      nameEn: "South Alamein",
      slug: "south-alamein",
      latitude: 30.8167,
      longitude: 28.7333,
      sortOrder: 7,
    },
    {
      nameAr: "النورث وست",
      nameEn: "North West",
      slug: "north-west",
      latitude: 30.8667,
      longitude: 28.7667,
      sortOrder: 8,
    },
  ],
  "ain-sokhna": [
    {
      nameAr: "العين السخنة",
      nameEn: "Ain Sokhna",
      slug: "ain-sokhna-city",
      latitude: 29.6,
      longitude: 32.3167,
      sortOrder: 1,
    },
    {
      nameAr: "جولف سيتي",
      nameEn: "Gulf of Suez",
      slug: "gulf-of-suez",
      latitude: 29.55,
      longitude: 32.3667,
      sortOrder: 2,
    },
    {
      nameAr: "الزفتاري",
      nameEn: "El Zafarana",
      slug: "el-zafarana",
      latitude: 29.1833,
      longitude: 32.6333,
      sortOrder: 3,
    },
  ],
  delta: [
    {
      nameAr: "المنصورة",
      nameEn: "Mansoura",
      slug: "mansoura-city",
      latitude: 31.0409,
      longitude: 31.3785,
      sortOrder: 1,
    },
    {
      nameAr: "طنطا",
      nameEn: "Tanta",
      slug: "tanta-city",
      latitude: 30.7865,
      longitude: 31.0004,
      sortOrder: 2,
    },
    {
      nameAr: "الزقازيق",
      nameEn: "Zagazig",
      slug: "zagazig",
      latitude: 30.5877,
      longitude: 31.502,
      sortOrder: 3,
    },
    {
      nameAr: "دمنهور",
      nameEn: "Damanhur",
      slug: "damanhur",
      latitude: 31.0361,
      longitude: 30.4689,
      sortOrder: 4,
    },
    {
      nameAr: "كفر الشيخ",
      nameEn: "Kafr El Sheikh",
      slug: "kafr-el-sheikh",
      latitude: 31.1081,
      longitude: 30.9431,
      sortOrder: 5,
    },
    {
      nameAr: "البحيرة",
      nameEn: "Beheira",
      slug: "beheira",
      latitude: 30.8575,
      longitude: 30.8118,
      sortOrder: 6,
    },
    {
      nameAr: "دمياط",
      nameEn: "Damietta",
      slug: "damietta",
      latitude: 31.4175,
      longitude: 31.8144,
      sortOrder: 7,
    },
    {
      nameAr: "بورسعيد",
      nameEn: "Port Said",
      slug: "port-said",
      latitude: 31.2653,
      longitude: 32.3019,
      sortOrder: 8,
    },
    {
      nameAr: "الإسماعيلية",
      nameEn: "Ismailia",
      slug: "ismailia",
      latitude: 30.6043,
      longitude: 32.2723,
      sortOrder: 9,
    },
    {
      nameAr: "العاشر من رمضان",
      nameEn: "10th of Ramadan",
      slug: "10th-of-ramadan",
      latitude: 30.3,
      longitude: 31.75,
      sortOrder: 10,
    },
  ],
  mansoura: [
    {
      nameAr: "وسط المدينة",
      nameEn: "City Centre",
      slug: "mansoura-city-centre",
      latitude: 31.0409,
      longitude: 31.3785,
      sortOrder: 1,
    },
    {
      nameAr: "المنشية",
      nameEn: "El Manshiya",
      slug: "el-manshiya",
      latitude: 31.0309,
      longitude: 31.3685,
      sortOrder: 2,
    },
    {
      nameAr: "شارع الجمالية",
      nameEn: "El Gomhoria",
      slug: "el-gomhoria",
      latitude: 31.0509,
      longitude: 31.3885,
      sortOrder: 3,
    },
  ],
  tanta: [
    {
      nameAr: "شارع الجامعة",
      nameEn: "University District",
      slug: "tanta-university",
      latitude: 30.7865,
      longitude: 31.0004,
      sortOrder: 1,
    },
    {
      nameAr: "شارع علي مبارك",
      nameEn: "El Ali",
      slug: "el-ali",
      latitude: 30.7765,
      longitude: 30.9904,
      sortOrder: 2,
    },
  ],
  assiut: [
    {
      nameAr: "أسيوط",
      nameEn: "Upper Egypt",
      slug: "assiut-upper",
      latitude: 27.1809,
      longitude: 31.1837,
      sortOrder: 1,
    },
  ],
  luxor: [
    {
      nameAr: "مدينة الأقصر",
      nameEn: "Luxor City",
      slug: "luxor-city",
      latitude: 25.6872,
      longitude: 32.6396,
      sortOrder: 1,
    },
  ],
  aswan: [
    {
      nameAr: "جزيرة الفنتين",
      nameEn: "Elephantine Island",
      slug: "elephantine",
      latitude: 24.0889,
      longitude: 32.8998,
      sortOrder: 1,
    },
  ],
  hurghada: [
    {
      nameAr: "الدهار",
      nameEn: "El Dahar",
      slug: "el-dahar",
      latitude: 27.1779,
      longitude: 33.8328,
      sortOrder: 1,
    },
    {
      nameAr: "الجونة",
      nameEn: "El Gouna",
      slug: "hurghada-el-gouna",
      latitude: 27.3983,
      longitude: 33.6763,
      sortOrder: 2,
    },
    {
      nameAr: "سوما باي",
      nameEn: "Soma Bay",
      slug: "soma-bay",
      latitude: 27.0867,
      longitude: 33.9167,
      sortOrder: 3,
    },
  ],
  fayoum: [
    {
      nameAr: "فيوم",
      nameEn: "Fayoum City",
      slug: "fayoum-city",
      latitude: 29.3099,
      longitude: 30.8418,
      sortOrder: 1,
    },
  ],
  "beni-suef": [
    {
      nameAr: "بني سويف",
      nameEn: "Beni Suef City",
      slug: "beni-suef-city",
      latitude: 29.0729,
      longitude: 31.0982,
      sortOrder: 1,
    },
  ],
  minya: [
    {
      nameAr: "المنيا",
      nameEn: "Minya City",
      slug: "minya-city",
      latitude: 28.1099,
      longitude: 30.7503,
      sortOrder: 1,
    },
  ],
  qalyubia: [
    {
      nameAr: "بنها",
      nameEn: "Banha",
      slug: "banha",
      latitude: 30.459,
      longitude: 31.1812,
      sortOrder: 1,
    },
    {
      nameAr: "القليوبية",
      nameEn: "Qalyub",
      slug: "qalyub",
      latitude: 30.4219,
      longitude: 31.2064,
      sortOrder: 2,
    },
  ],
};

const categories = [
  {
    nameAr: "سكني",
    nameEn: "Residential",
    slug: "residential",
    iconName: "Home",
    sortOrder: 1,
    types: [
      ["شقة", "Apartment", "apartment"],
      ["فيلا", "Villa", "villa"],
      ["دوبلكس", "Duplex", "duplex"],
      ["استوديو", "Studio", "studio"],
      ["بنتهاوس", "Penthouse", "penthouse"],
      ["تاون هاوس", "Townhouse", "townhouse"],
      ["كريم بيت", "Twin House", "twin-house"],
      ["روف", "Roof", "roof"],
      ["دوبلكس فيلا", "Duplex Villa", "duplex-villa"],
      ["مالتيفميلي", "Multi-family", "multi-family"],
    ],
  },
  {
    nameAr: "تجاري",
    nameEn: "Commercial",
    slug: "commercial",
    iconName: "Store",
    sortOrder: 2,
    types: [
      ["مكتب", "Office", "office"],
      ["محل تجاري", "Shop", "shop"],
      ["معرض", "Showroom", "showroom"],
      ["مستودع", "Warehouse", "warehouse"],
      ["فندق", "Hotel", "hotel"],
      ["مبنى تجاري", "Commercial Building", "commercial-building"],
      ["مطعم", "Restaurant", "restaurant"],
      ["عيادة", "Clinic", "clinic"],
    ],
  },
  {
    nameAr: "أراضي",
    nameEn: "Land",
    slug: "land",
    iconName: "Map",
    sortOrder: 3,
    types: [
      ["أرض سكنية", "Residential Land", "residential-land"],
      ["أرض تجارية", "Commercial Land", "commercial-land"],
      ["أرض زراعية", "Agricultural Land", "agricultural-land"],
      ["أرض صناعية", "Industrial Land", "industrial-land"],
    ],
  },
  {
    nameAr: "عملي",
    nameEn: "Compound",
    slug: "compound",
    iconName: "Building2",
    sortOrder: 4,
    types: [
      ["فيلا تاون هاوس", "Townhouse Villa", "compound-townhouse"],
      ["فيلا مودرن", "Modern Villa", "compound-modern-villa"],
      ["شقة دوبلكس", "Duplex Apartment", "compound-duplex"],
      ["بنتهاوس", "Penthouse", "compound-penthouse"],
    ],
  },
];

const amenities = [
  ["indoor", "تكييف مركزي", "Central AC", "Snowflake"],
  ["indoor", "تكييف سبليت", "Split AC", "Wind"],
  ["indoor", "مطبخ مجهز", "Equipped Kitchen", "ChefHat"],
  ["indoor", "غرفة خادمة", "Maid Room", "DoorOpen"],
  ["indoor", "غرفة سائق", "Driver Room", "UserRound"],
  ["indoor", "مستودع", "Storage Room", "Archive"],
  ["indoor", "مصعد", "Elevator", "ArrowUpDown"],
  ["indoor", "إنترنت", "Internet", "Wifi"],
  ["indoor", "أمن", "Security", "Shield"],
  ["indoor", "كاميرات مراقبة", "CCTV", "Camera"],
  ["indoor", "مدخل خاص", "Private Entrance", "KeyRound"],
  ["indoor", "غرفة غسيل", "Laundry Room", "Shirt"],
  ["indoor", "مجلس رجال", "Men Majlis", "Sofa"],
  ["indoor", "مجلس نساء", "Women Majlis", "Sofa"],
  ["indoor", "تدفئة", "Heating", "Flame"],
  ["indoor", "şofben", "Water Heater", "FlameKindling"],
  ["outdoor", "حديقة", "Garden", "Trees"],
  ["outdoor", "مسبح", "Pool", "Waves"],
  ["outdoor", "موقف خاص", "Private Parking", "Car"],
  ["outdoor", "موقف مظلل", "Shaded Parking", "Umbrella"],
  ["outdoor", "ملعب أطفال", "Playground", "Gamepad2"],
  ["outdoor", "بوابة إلكترونية", "Electronic Gate", "DoorClosed"],
  ["outdoor", "سور", "Fence", "PanelsTopLeft"],
  ["outdoor", "شرفة", "Balcony", "PanelTop"],
  ["outdoor", "سطح", "Roof Access", "HousePlus"],
  ["outdoor", "فناء", "Courtyard", "Flower2"],
  ["outdoor", "جراج", "Garage", "CarFront"],
  ["location", "قريب من المسجد", "Near Mosque", "MapPin"],
  ["location", "قريب من المدارس", "Near Schools", "GraduationCap"],
  ["location", "قريب من المستشفى", "Near Hospital", "Hospital"],
  ["location", "قريب من الأسواق", "Near Markets", "ShoppingBag"],
  ["location", "على شارع رئيسي", "Main Road", "Route"],
  ["location", "شارع جانبي", "Side Street", "Milestone"],
  ["location", "أرضي", "Ground Floor", "Layers"],
  ["location", "واجهة شمالية", "North Facing", "Compass"],
  ["location", "زاوية", "Corner Lot", "MapPinned"],
  ["location", "واجهة شارع", "Street Facing", "Building"],
  ["location", "قرب المترو", "Near Metro", "TrainFront"],
  ["location", "قرب محطة ميكروباص", "Near Microbus Station", "Bus"],
  ["utilities", "ماء", "Water", "Droplets"],
  ["utilities", "كهرباء", "Electricity", "Zap"],
  ["utilities", "صرف صحي", "Sewerage", "Pipette"],
  ["utilities", "غاز", "Gas Supply", "FlameKindling"],
  ["utilities", "عداد مستقل", "Separate Meter", "Gauge"],
  ["utilities", " خزان مياه", "Water Tank", "Cylinder"],
  ["luxury", "جاكوزي", "Jacuzzi", "Bath"],
  ["luxury", "سينما منزلية", "Home Cinema", "Clapperboard"],
  ["luxury", "مطبخ خارجي", "Outdoor Kitchen", "Utensils"],
  ["luxury", "صالة رياضية", "Gym", "Dumbbell"],
  ["luxury", "نظام ذكي", "Smart Home", "Cpu"],
  ["luxury", "مجلس ضيوف", "Guest Lounge", "Armchair"],
  ["luxury", "غرفة بلياردو", "Billiards Room", "Circle"],
  ["luxury", "ملعب تنس", "Tennis Court", "CircleDot"],
  ["compound", "بوابة مغلقة", "Gated Community", "ShieldCheck"],
  ["compound", "أمن 24 ساعة", "24/7 Security", "ShieldCheck"],
  ["compound", "مساحات خضراء", "Green Areas", "Trees"],
  ["compound", "مسار للمشي", "Walking Track", "Footprints"],
  ["compound", "نادي اجتماعي", "Clubhouse", "Building2"],
  ["compound", "مسبح مشترك", "Shared Pool", "Waves"],
  ["compound", "مساحة تجارية", "Commercial Area", "Store"],
  ["compound", "حديقة مركزية", "Central Park", "TreePine"],
] as const;

const featureFlags = [
  {
    key: "MAP_VIEW",
    isEnabled: true,
    description: "Show interactive map on property pages",
  },
  {
    key: "AGENT_REGISTRATION",
    isEnabled: false,
    description: "Allow users to register as agents",
  },
  {
    key: "OFFICE_SUBSCRIPTIONS",
    isEnabled: false,
    description: "Office subscription model",
  },
  {
    key: "AI_SEARCH",
    isEnabled: false,
    description: "AI-powered semantic search",
  },
  {
    key: "PUSH_NOTIFICATIONS",
    isEnabled: false,
    description: "Web push notifications",
  },
  {
    key: "PRICE_HISTORY",
    isEnabled: true,
    description: "Show price history chart on property pages",
  },
  {
    key: "COMPOUNDS",
    isEnabled: true,
    description: "Compound/project listings support",
  },
  {
    key: "INSTALLMENT_PLANS",
    isEnabled: true,
    description: "Show installment payment plans on properties",
  },
  {
    key: "DEVELOPER_PROFILES",
    isEnabled: true,
    description: "Developer profile pages and listings",
  },
  {
    key: "AREA_INTELLIGENCE",
    isEnabled: false,
    description: "Area pricing and investment data",
  },
  {
    key: "FINANCIAL_TOOLS",
    isEnabled: false,
    description: "Mortgage calculator and affordability tools",
  },
  {
    key: "NATURAL_LANGUAGE_SEARCH",
    isEnabled: false,
    description: "AI natural language property search",
  },
];

async function seedRegions() {
  for (const region of regions) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: region,
      create: region,
    });
  }
}

async function seedCities() {
  for (const [regionSlug, cities] of Object.entries(citiesByRegion)) {
    const region = await prisma.region.findUniqueOrThrow({
      where: { slug: regionSlug },
    });

    for (const city of cities) {
      await prisma.city.upsert({
        where: { slug: city.slug },
        update: { ...city, regionId: region.id, isActive: true },
        create: { ...city, regionId: region.id, isActive: true },
      });
    }
  }
}

async function seedCategories() {
  for (const category of categories) {
    const createdCategory = await prisma.propertyCategory.upsert({
      where: { slug: category.slug },
      update: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        iconName: category.iconName,
        isActive: true,
        sortOrder: category.sortOrder,
      },
      create: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        slug: category.slug,
        iconName: category.iconName,
        isActive: true,
        sortOrder: category.sortOrder,
      },
    });

    for (const [index, [nameAr, nameEn, slug]] of category.types.entries()) {
      await prisma.propertyType.upsert({
        where: { slug },
        update: {
          categoryId: createdCategory.id,
          nameAr,
          nameEn,
          isActive: true,
          sortOrder: index + 1,
        },
        create: {
          categoryId: createdCategory.id,
          nameAr,
          nameEn,
          slug,
          isActive: true,
          sortOrder: index + 1,
        },
      });
    }
  }
}

async function seedAmenities() {
  for (const [
    index,
    [category, nameAr, nameEn, iconName],
  ] of amenities.entries()) {
    await prisma.amenity.upsert({
      where: {
        nameAr_category: {
          nameAr,
          category,
        },
      },
      update: {
        nameEn,
        iconName,
        sortOrder: index + 1,
      },
      create: {
        nameAr,
        nameEn,
        iconName,
        category,
        sortOrder: index + 1,
      },
    });
  }
}

async function seedSuperAdmin() {
  const hash = await bcrypt.hash("JoudAdmin@2024!", 12);

  await prisma.user.upsert({
    where: { email: "admin@joud.sa" },
    update: {},
    create: {
      email: "admin@joud.sa",
      passwordHash: hash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: "مدير",
          lastName: "النظام",
          preferredLocale: "ar",
        },
      },
    },
  });
}

async function seedFeatureFlags() {
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        description: flag.description,
      },
      create: flag,
    });
  }
}

async function seedDemoProperties() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@joud.sa" },
    select: { id: true },
  });

  if (!admin) {
    console.log("Admin user not found, skipping demo properties.");
    return;
  }

  const newCairoRegion = await prisma.region.findUnique({
    where: { slug: "new-cairo" },
  });
  const sheikhZayedRegion = await prisma.region.findUnique({
    where: { slug: "sheikh-zayed" },
  });
  const octoberRegion = await prisma.region.findUnique({
    where: { slug: "6th-october" },
  });
  const newCapitalRegion = await prisma.region.findUnique({
    where: { slug: "new-administrative-capital" },
  });
  const cairoRegion = await prisma.region.findUnique({
    where: { slug: "cairo" },
  });

  const fifthSettlement = await prisma.city.findUnique({
    where: { slug: "fifth-settlement" },
  });
  const sheikhZayedCity = await prisma.city.findUnique({
    where: { slug: "sz-2nd-district" },
  });
  const octoberCity = await prisma.city.findUnique({
    where: { slug: "investors" },
  });
  const adminDistrict = await prisma.city.findUnique({
    where: { slug: "administrative-district" },
  });
  const heliopolis = await prisma.city.findUnique({
    where: { slug: "heliopolis" },
  });
  const maadi = await prisma.city.findUnique({ where: { slug: "maadi" } });
  const downtown = await prisma.city.findUnique({
    where: { slug: "downtown-cairo" },
  });

  const residential = await prisma.propertyCategory.findUnique({
    where: { slug: "residential" },
  });
  const commercial = await prisma.propertyCategory.findUnique({
    where: { slug: "commercial" },
  });

  if (!residential || !commercial) {
    console.log("Categories not found, skipping demo properties.");
    return;
  }

  const apartmentType = await prisma.propertyType.findUnique({
    where: { slug: "apartment" },
  });
  const villaType = await prisma.propertyType.findUnique({
    where: { slug: "villa" },
  });
  const duplexType = await prisma.propertyType.findUnique({
    where: { slug: "duplex" },
  });
  const studioType = await prisma.propertyType.findUnique({
    where: { slug: "studio" },
  });
  const officeType = await prisma.propertyType.findUnique({
    where: { slug: "office" },
  });
  const penthouseType = await prisma.propertyType.findUnique({
    where: { slug: "penthouse" },
  });

  const demoProperties = [
    {
      titleAr: "شقة فاخرة في التجمع الخامس",
      titleEn: "Luxury Apartment in Fifth Settlement",
      descriptionAr:
        "شقة واسعة بإطلالة مميزة في أحد أرقى مجمعات التجمع الخامس. تتميز بتصميم عصري وتشطيبات عالية الجودة مع مواقف سيارات خاصة وأمن على مدار الساعة.",
      descriptionEn:
        "Spacious apartment with stunning views in one of Fifth Settlement's finest compounds. Features modern design, high-quality finishes, private parking, and 24/7 security.",
      listingType: "SALE" as const,
      price: 4500000,
      area: 180,
      bedrooms: 3,
      bathrooms: 2,
      cityId: fifthSettlement?.id ?? "",
      regionId: newCairoRegion?.id ?? "",
      categoryId: residential.id,
      typeId: apartmentType?.id ?? "",
      latitude: 30.0281,
      longitude: 31.4681,
    },
    {
      titleAr: "فيلا تاون هاوس في الشيخ زايد",
      titleEn: "Townhouse Villa in Sheikh Zayed",
      descriptionAr:
        "فيلا تاون هاوس بتصميم معماري أنيق في الشيخ زايد. تحتوي على 4 غرف نوم وحديقة خاصة ومطبخ مجهز بالكامل مع نظام أمان ذكي.",
      descriptionEn:
        "Elegantly designed townhouse villa in Sheikh Zayed. Features 4 bedrooms, private garden, fully equipped kitchen with smart home security system.",
      listingType: "SALE" as const,
      price: 12000000,
      area: 320,
      bedrooms: 4,
      bathrooms: 3,
      cityId: sheikhZayedCity?.id ?? "",
      regionId: sheikhZayedRegion?.id ?? "",
      categoryId: residential.id,
      typeId: villaType?.id ?? "",
      latitude: 30.0217,
      longitude: 31.0117,
    },
    {
      titleAr: "دوبلكس في 6 أكتوبر بجوار مول مصر",
      titleEn: "Duplex near Mall of Egypt in 6th October",
      descriptionAr:
        "دوبلكس فسيح بموقع مميز بجوار مول مصر في 6 أكتوبر. يضم صالة كبيرة ومجلس رجال ومنطقة معيشة مفتوحة مع إطلالة على الحديقة.",
      descriptionEn:
        "Spacious duplex in a prime location near Mall of Egypt in 6th October. Features large salon, men's majlis, open living area with garden view.",
      listingType: "SALE" as const,
      price: 8500000,
      area: 260,
      bedrooms: 4,
      bathrooms: 3,
      cityId: octoberCity?.id ?? "",
      regionId: octoberRegion?.id ?? "",
      categoryId: residential.id,
      typeId: duplexType?.id ?? "",
      latitude: 29.9717,
      longitude: 31.0117,
    },
    {
      titleAr: "شقة استوديو في العاصمة الإدارية الجديدة",
      titleEn: "Studio Apartment in New Administrative Capital",
      descriptionAr:
        "استوديو عصري في العاصمة الإدارية الجديدة بتشطيبات سوبر لوكس. مناسب للأفراد أو الاستثمار مع مرافق مشتركة متكاملة.",
      descriptionEn:
        "Modern studio in the New Administrative Capital with super luxury finishes. Ideal for individuals or investment with complete shared facilities.",
      listingType: "SALE" as const,
      price: 2800000,
      area: 75,
      bedrooms: 0,
      bathrooms: 1,
      cityId: adminDistrict?.id ?? "",
      regionId: newCapitalRegion?.id ?? "",
      categoryId: residential.id,
      typeId: studioType?.id ?? "",
      latitude: 30.0074,
      longitude: 31.7669,
    },
    {
      titleAr: "شقة للإيجار في مصر الجديدة",
      titleEn: "Apartment for Rent in Heliopolis",
      descriptionAr:
        "شقة أنيقة للإيجار في حي مصر الجديدة الراقي. تقع بالقرب من شارع العروبة ومترو الأنفاق مع موقف سيارة مشترك.",
      descriptionEn:
        "Elegant apartment for rent in the upscale Heliopolis district. Located near Orouba Street and metro station with shared parking.",
      listingType: "RENT" as const,
      price: 15000,
      area: 140,
      bedrooms: 3,
      bathrooms: 2,
      cityId: heliopolis?.id ?? "",
      regionId: cairoRegion?.id ?? "",
      categoryId: residential.id,
      typeId: apartmentType?.id ?? "",
      latitude: 30.0876,
      longitude: 31.3271,
    },
    {
      titleAr: "بنتهاوس في المعادي على النيل",
      titleEn: "Penthouse in Maadi on the Nile",
      descriptionAr:
        "بنتهاوس فاخر بإطلالة مباشرة على نهر النيل في المعادي. يضم تراس واسع ومسبح خاص وتشطيبات من أرقى الماركات العالمية.",
      descriptionEn:
        "Luxurious penthouse with direct Nile view in Maadi. Features wide terrace, private pool, and finishes from top international brands.",
      listingType: "SALE" as const,
      price: 25000000,
      area: 400,
      bedrooms: 5,
      bathrooms: 4,
      cityId: maadi?.id ?? "",
      regionId: cairoRegion?.id ?? "",
      categoryId: residential.id,
      typeId: penthouseType?.id ?? "",
      latitude: 29.9602,
      longitude: 31.2571,
    },
    {
      titleAr: "مكتب تجاري في التجمع الخامس",
      titleEn: "Commercial Office in Fifth Settlement",
      descriptionAr:
        "مكتب تجاري بمساحة 120 متر في التجمع الخامس. مناسب لشركات التكنولوجيا أو الاستشارات مع مواقف سيارات كافية.",
      descriptionEn:
        "120 sqm commercial office in Fifth Settlement. Suitable for tech companies or consulting firms with ample parking.",
      listingType: "RENT" as const,
      price: 25000,
      area: 120,
      bedrooms: 0,
      bathrooms: 2,
      cityId: fifthSettlement?.id ?? "",
      regionId: newCairoRegion?.id ?? "",
      categoryId: commercial.id,
      typeId: officeType?.id ?? "",
      latitude: 30.0364,
      longitude: 31.4364,
    },
    {
      titleAr: "شقة مميزة للبيع في داون تاون القاهرة",
      titleEn: "Featured Apartment for Sale in Downtown Cairo",
      descriptionAr:
        "شقة مميزة بتصميم كلاسيكي في قلب داون تاون القاهرة. تقع بالقرب من ميdan التحرير وشارع الكورنيش مع وصول سهل لل疭 Transit.",
      descriptionEn:
        "Featured apartment with classic design in the heart of Downtown Cairo. Near Tahrir Square and Corniche with easy transit access.",
      listingType: "SALE" as const,
      price: 3200000,
      area: 120,
      bedrooms: 2,
      bathrooms: 1,
      cityId: downtown?.id ?? "",
      regionId: cairoRegion?.id ?? "",
      categoryId: residential.id,
      typeId: apartmentType?.id ?? "",
      isFeatured: true,
      latitude: 30.0444,
      longitude: 31.2357,
    },
  ];

  let created = 0;
  for (const [index, prop] of demoProperties.entries()) {
    const slug = `demo-${prop.listingType.toLowerCase()}-${index + 1}`;
    const existing = await prisma.property.findUnique({ where: { slug } });
    if (existing) continue;

    await prisma.property.create({
      data: {
        slug,
        userId: admin.id,
        titleAr: prop.titleAr,
        titleEn: prop.titleEn,
        descriptionAr: prop.descriptionAr,
        descriptionEn: prop.descriptionEn,
        listingType: prop.listingType,
        price: prop.price,
        currency: "EGP",
        area: prop.area,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        cityId: prop.cityId,
        regionId: prop.regionId,
        categoryId: prop.categoryId,
        typeId: prop.typeId,
        status: "APPROVED",
        isFeatured: prop.isFeatured ?? false,
        publishedAt: new Date(),
        approvedAt: new Date(),
        latitude: prop.latitude,
        longitude: prop.longitude,
      },
    });
    created++;
  }

  console.log(`Demo properties seeded: ${created} new.`);
}

const neighborhoodsByCity: Record<
  string,
  { nameAr: string; nameEn: string; slug: string }[]
> = {
  heliopolis: [
    { nameAr: "شارع العروبة", nameEn: "Orouba Street", slug: "orouba-street" },
    {
      nameAr: "شارع الأهرام",
      nameEn: "Al Ahram Street",
      slug: "al-ahram-street",
    },
    { nameAr: "العبور", nameEn: "Al Obour", slug: "al-obour" },
    { nameAr: "روكسي", nameEn: "Roxi", slug: "roxi" },
    { nameAr: "سان استيفانو", nameEn: "San Stefano", slug: "san-stefano" },
    {
      nameAr: "شارع بورسعيد",
      nameEn: "Port Said Street",
      slug: "port-said-street",
    },
    { nameAr: "ال镆يلية", nameEn: "El Melia", slug: "el-melia" },
    { nameAr: "أونطاتي", nameEn: "Oonty", slug: "oonty" },
  ],
  maadi: [
    { nameAr: "المعادي الجديدة", nameEn: "New Maadi", slug: "new-maadi" },
    { nameAr: "المعادي القديمة", nameEn: "Old Maadi", slug: "old-maadi" },
    { nameAr: "دار السلام", nameEn: "Dar El Salam", slug: "dar-el-salam" },
    { nameAr: "ال教导ية", nameEn: "El Elograria", slug: "elograria" },
    { nameAr: "شارع 9", nameEn: "Street 9", slug: "street-9" },
    { nameAr: "شارع 14", nameEn: "Street 14", slug: "street-14" },
    { nameAr: "البساتين", nameEn: "Basatin", slug: "basatin-maadi" },
    {
      nameAr: "المعادي الجديدة جنوب",
      nameEn: "South Maadi",
      slug: "south-maadi",
    },
  ],
  "nasr-city": [
    {
      nameAr: "شارع مصطفى النحاس",
      nameEn: "Mostafa El Nahas Street",
      slug: "mostafa-el-nahas",
    },
    {
      nameAr: "شارع عبد المنعم رياض",
      nameEn: "Abdel Moniem Riad Street",
      slug: "abdel-moniem-riad",
    },
    {
      nameAr: "شارع عباس العقاد",
      nameEn: "Abbas El Akkad Street",
      slug: "abbas-el-akkad",
    },
    { nameAr: "العزيمة", nameEn: "El Azima", slug: "el-azima" },
    {
      nameAr: "شارع المختصر",
      nameEn: "Al Mukhtasar Street",
      slug: "al-mukhtasar",
    },
    {
      nameAr: "شارع مأمون سلامة",
      nameEn: "Mamoun Salama Street",
      slug: "mamoun-salama",
    },
  ],
  "downtown-cairo": [
    { nameAr: "ميدان التحرير", nameEn: "Tahrir Square", slug: "tahrir-square" },
    { nameAr: "شارع الكورنيش", nameEn: "Corniche Street", slug: "corniche" },
    { nameAr: "العباسية", nameEn: "Abbassia", slug: "abbassia-downtown" },
    { nameAr: "باب اللوق", nameEn: "Bab El Louq", slug: "bab-el-louq" },
    { nameAr: "العتبة", nameEn: "Ataba", slug: "ataba" },
    { nameAr: "قصر النيل", nameEn: "Qasr El Nil", slug: "qasr-el-nil" },
    { nameAr: "ميدان العتبة", nameEn: "Ataba Square", slug: "ataba-square" },
  ],
  zamalek: [
    {
      nameAr: "شارع 26 يوليو",
      nameEn: "26 July Street",
      slug: "26-july-street",
    },
    { nameAr: "شارع السودان", nameEn: "Sudan Street", slug: "sudan-street" },
    {
      nameAr: "شارع أحمد عرابي",
      nameEn: "Ahmed Orabi Street",
      slug: "ahmed-orabi",
    },
    { nameAr: "الجزيرة", nameEn: "Gezira", slug: "gezira" },
    { nameAr: "شارع 9 يوليو", nameEn: "9 July Street", slug: "9-july-street" },
  ],
  mohandessin: [
    {
      nameAr: "شارع جامعة الدول العربية",
      nameEn: "Gamal Abdel Nasser Street",
      slug: "gamal-abdel-nasser",
    },
    { nameAr: "شارع شهاب", nameEn: "Shehab Street", slug: "shehab" },
    {
      nameAr: "شارع محيي الدين أبو العز",
      nameEn: "Mohy El Din Abu El Ezz",
      slug: "mohy-abu-el-ezz",
    },
    { nameAr: "شارع العريش", nameEn: "El Arish Street", slug: "el-arish" },
    { nameAr: "شارع البافريز", nameEn: "Beverages Street", slug: "beverages" },
    { nameAr: "شارع المحطة", nameEn: "El Mahatta Street", slug: "el-mahatta" },
  ],
  dokki: [
    {
      nameAr: "شارع التحرير",
      nameEn: "El Tahrir Street",
      slug: "el-tahrir-dokki",
    },
    {
      nameAr: "شارع شهاب",
      nameEn: "Shehab Street Dokki",
      slug: "shehab-dokki",
    },
    { nameAr: "شارع مسي", nameEn: "Messi Street", slug: "messi-street" },
    {
      nameAr: "شارع قصر العيني",
      nameEn: "Qasr El Aini Street",
      slug: "qasr-el-aini",
    },
    { nameAr: "الدقي", nameEn: "Dokki Center", slug: "dokki-center" },
  ],
  "sidi-gaber": [
    { nameAr: "محطة الرمل", nameEn: "Ramel Station", slug: "ramel-street" },
    {
      nameAr: "شارع فوزي معاذ",
      nameEn: "Fawzy Moaaz Street",
      slug: "fawzy-moaaz",
    },
    {
      nameAr: "سهرة الجديدة",
      nameEn: "Sohra El Gedida",
      slug: "sohra-el-gedida",
    },
    { nameAr: "الهانوفيل", nameEn: "El Hanoville", slug: "el-hanoville" },
  ],
  smouha: [
    { nameAr: "سموحة الجديدة", nameEn: "New Smouha", slug: "new-smouha" },
    {
      nameAr: "شارع فوزي معاذ",
      nameEn: "Fawzi Moaaz Street Smouha",
      slug: "fawzi-moaaz-smouha",
    },
    { nameAr: "العصافرة", nameEn: "Asafra", slug: "asafra-smouha" },
    {
      nameAr: "شارع الحرفيين",
      nameEn: "El Harfeen Street",
      slug: "el-harfeen",
    },
  ],
  cleopatra: [
    {
      nameAr: "شارع كليوباترا",
      nameEn: "Cleopatra Street",
      slug: "cleopatra-main",
    },
    { nameAr: "شارع المndارة", nameEn: "El Mandara", slug: "el-mandara" },
    { nameAr: "سبتية", nameEn: "Sidi Bishr", slug: "sidi-bishr" },
    {
      nameAr: "شارع 홀인스타인",
      nameEn: "El Halawein Street",
      slug: "el-halawein",
    },
  ],
  shubra: [
    { nameAr: "شارع شبرا", nameEn: "Shubra Street", slug: "shubra-main" },
    {
      nameAr: "شارع البساتين",
      nameEn: "El Basateen Street",
      slug: "el-basateen-shubra",
    },
    { nameAr: "كوستكا", nameEn: "Kozzika", slug: "kozzika" },
    { nameAr: "روض الفرج", nameEn: "Rod El Farag", slug: "rod-el-farag" },
  ],
  "garden-city": [
    {
      nameAr: "شارع قصر العيني",
      nameEn: "Qasr El Aini Street",
      slug: "qasr-el-aini-garden",
    },
    { nameAr: "شارع البستان", nameEn: "El Bostan Street", slug: "el-bostan" },
    { nameAr: "شارع الفلكي", nameEn: "El Falaki Street", slug: "el-falaki" },
  ],
  pyramids: [
    {
      nameAr: "شارع الهرم",
      nameEn: "Pyramids Street",
      slug: "pyramids-street",
    },
    { nameAr: "شارع أوسيم", nameEn: "Ousim Street", slug: "ousim-street" },
    {
      nameAr: "شارع أبو الهول",
      nameEn: "Abu El Hol Street",
      slug: "abu-el-hol",
    },
    {
      nameAr: "ظاهرية المعادي",
      nameEn: "Zahraa El Maadi",
      slug: "zahraa-el-maadi-pyramids",
    },
  ],
  faisal: [
    { nameAr: "شارع فيصل", nameEn: "Faisal Street", slug: "faisal-street" },
    {
      nameAr: "شارع جامعة الدول",
      nameEn: "Gamal Abdel Nasser Faisal",
      slug: "nasser-faisal",
    },
    {
      nameAr: "شارع السودان",
      nameEn: "Sudan Street Faisal",
      slug: "sudan-faisal",
    },
  ],
  investors: [
    {
      nameAr: "شارع المستثمرين",
      nameEn: "Investors Street",
      slug: "investors-street",
    },
    {
      nameAr: "شارع المحور",
      nameEn: "Al Mohandessin Street 6th Oct",
      slug: "mohandessin-street-6th",
    },
  ],
  "oct-1st-district": [
    {
      nameAr: "شارع الحي الأول",
      nameEn: "1st District Street",
      slug: "1st-district-street",
    },
  ],
  "oct-3rd-district": [
    {
      nameAr: "شارع الحي الثالث",
      nameEn: "3rd District Street",
      slug: "3rd-district-street",
    },
  ],
  "oct-7th-district": [
    {
      nameAr: "شارع الحي السابع",
      nameEn: "7th District Street",
      slug: "7th-district-street",
    },
  ],
  "hay-el-nahda": [
    { nameAr: "شارع النهضة", nameEn: "Nahda Street", slug: "nahda-street" },
  ],
  "new-giza": [
    {
      nameAr: "شارع الجيزة الجديدة",
      nameEn: "New Giza Street",
      slug: "new-giza-street",
    },
    {
      nameAr: "شارع المحور",
      nameEn: "Al Mohandessin New Giza",
      slug: "mohandessin-new-giza",
    },
  ],
  "sz-al-mohandessin": [
    {
      nameAr: "شارع المحور",
      nameEn: "Al Mohandessin SZ",
      slug: "al-mohandessin-sz",
    },
  ],
  "sz-2nd-district": [
    {
      nameAr: "شارع الحي الثاني",
      nameEn: "2nd District Street",
      slug: "2nd-district-sz",
    },
  ],
  "sz-5th-district": [
    {
      nameAr: "شارع الحي الخامس",
      nameEn: "5th District Street",
      slug: "5th-district-sz",
    },
  ],
  "sz-zahraa": [
    { nameAr: "شارع زهاء", nameEn: "Zahraa Street", slug: "zahraa-street" },
  ],
  "sz-upper-egypt": [
    {
      nameAr: "شارع ص Upper Egypt",
      nameEn: "Upper Egypt SZ",
      slug: "upper-egypt-sz",
    },
  ],
  "fifth-settlement": [
    { nameAr: "شارع 90", nameEn: "Street 90", slug: "street-90" },
    {
      nameAr: "التجمع الخامس",
      nameEn: "Fifth Settlement Main",
      slug: "fifth-settlement-main",
    },
  ],
  "third-settlement": [
    {
      nameAr: "التجمع الثالث",
      nameEn: "Third Settlement Main",
      slug: "third-settlement-main",
    },
  ],
  "rehab-city": [
    { nameAr: "شارع الإصلاح", nameEn: "Rehab Street", slug: "rehab-street" },
  ],
  amaya: [
    { nameAr: "شارع أمaya", nameEn: "Amaya Street", slug: "amaya-street" },
  ],
  icc: [
    { nameAr: "شارع الآي سي سي", nameEn: "ICC Street", slug: "icc-street" },
  ],
  "jw-marriott": [
    {
      nameAr: "شارع JW ماريوت",
      nameEn: "JW Marriott Street",
      slug: "jw-marriott-street",
    },
  ],
  "administrative-district": [
    { nameAr: "شارع الإدارة", nameEn: "Admin Street", slug: "admin-street" },
  ],
  "vital-district": [
    {
      nameAr: "شارع المنطقة الحيوية",
      nameEn: "Vital District Street",
      slug: "vital-district-street",
    },
  ],
  "residential-district": [
    {
      nameAr: "شارع المنطقة السكنية",
      nameEn: "Residential Street",
      slug: "residential-street",
    },
  ],
  "r8-district": [
    { nameAr: "شارع R8", nameEn: "R8 Street", slug: "r8-street" },
  ],
  "mansoura-city-centre": [
    {
      nameAr: "شارع الجمالية",
      nameEn: "El Gomhoria Mansoura",
      slug: "gomhoria-mansoura-centre",
    },
    { nameAr: "شارع الحلوية", nameEn: "El Halawia Street", slug: "el-halawia" },
  ],
  "el-manshiya": [
    {
      nameAr: "شارع المنشية",
      nameEn: "El Manshiya Street",
      slug: "el-manshiya-street",
    },
  ],
  "el-gomhoria": [
    {
      nameAr: "شارع الجمالية",
      nameEn: "El Gomhoria Street",
      slug: "el-gomhoria-street",
    },
  ],
  "tanta-university": [
    {
      nameAr: "شارع الجامعة",
      nameEn: "University Street Tanta",
      slug: "university-street-tanta",
    },
  ],
  "el-ali": [
    {
      nameAr: "شارع علي مبارك",
      nameEn: "Ali Mubarak Street",
      slug: "ali-mubarak-tanta",
    },
  ],
  "assiut-upper": [
    {
      nameAr: "شارع أسيوط",
      nameEn: "Assiut Center Street",
      slug: "assiut-center-street",
    },
    { nameAr: "وسط أسيوط", nameEn: "Assiut Center", slug: "assiut-center" },
  ],
  helwan: [
    {
      nameAr: "شارع حلوان",
      nameEn: "Helwan Street",
      slug: "helwan-street-area",
    },
    { nameAr: "عين حلوان", nameEn: "Ain Helwan", slug: "ain-helwan" },
    {
      nameAr: "المعصرة",
      nameEn: "El Maasara Helwan",
      slug: "el-maasara-helwan",
    },
  ],
  basatin: [
    {
      nameAr: "دار السلام",
      nameEn: "Dar Salam Basatin",
      slug: "dar-salam-basatin",
    },
    {
      nameAr: "المعصرة",
      nameEn: "El Maasara Basatin",
      slug: "el-maasara-basatin",
    },
  ],
  manial: [
    { nameAr: "المنيل", nameEn: "Manial", slug: "manial-area" },
    { nameAr: "شارع السواحل", nameEn: "El Sawahel Street", slug: "el-sawahel" },
  ],
  abbassia: [
    {
      nameAr: "شارع triple",
      nameEn: "Triple Street",
      slug: "triple-street-abbassia",
    },
    {
      nameAr: "شارع عباس",
      nameEn: "Abbas Street",
      slug: "abbas-street-abbassia",
    },
    {
      nameAr: "كوبري الجلاء",
      nameEn: "Gala'a Bridge",
      slug: "galaa-bridge-abbassia",
    },
  ],
  "al-gomrok": [
    { nameAr: "الجمرك", nameEn: "Al Gomrok", slug: "al-gomrok-area" },
    {
      nameAr: "شارع المحمديه",
      nameEn: "El Mahmodia Street",
      slug: "el-mahmodia",
    },
  ],
  montaza: [
    { nameAr: "المنتزه", nameEn: "Montaza", slug: "montaza-area" },
    {
      nameAr: "الحديقة العامة",
      nameEn: "Public Garden",
      slug: "public-garden-montaza",
    },
    { nameAr: "شارع فلمنج", nameEn: "Fleming", slug: "fleming" },
  ],
  "el-warraq": [
    { nameAr: "الوراق", nameEn: "El Warraq", slug: "el-warraq-area" },
    {
      nameAr: "شارع المحور",
      nameEn: "Mohandessin El Warraq",
      slug: "mohandessin-warraq",
    },
  ],
  imbaba: [
    { nameAr: "إمبابة", nameEn: "Imbaba", slug: "imbaba-area" },
    { nameAr: "شارع تIFE", nameEn: "Teraa Street", slug: "teraa-street" },
    {
      nameAr: "بولاق الدكرور",
      nameEn: "Bulaq El Dakrour",
      slug: "bulaq-el-dakrour",
    },
  ],
  "marsa-matrouh": [
    {
      nameAr: "مرسى مطروح",
      nameEn: "Marsa Matrouh",
      slug: "marsa-matrouh-area",
    },
    {
      nameAr: "شارع الكورنيش",
      nameEn: "Corniche Matrouh",
      slug: "corniche-matrouh",
    },
  ],
  "el-gouna": [
    { nameAr: "الجونة", nameEn: "El Gouna", slug: "el-gouna-area" },
    { nameAr: "marina", nameEn: "Marina Gouna", slug: "marina-gouna" },
  ],
  "sidi-abdel-rahman": [
    {
      nameAr: "سيدي عبد الرحمن",
      nameEn: "Sidi Abdel Rahman",
      slug: "sidi-abdel-rahman-area",
    },
    { nameAr: "المرسى", nameEn: "El Marsa", slug: "el-marsa-sidi-abdel" },
  ],
  "tanta-city": [
    { nameAr: "شارع سعيد", nameEn: "El Said Street", slug: "el-said-tanta" },
  ],
  zagazig: [
    { nameAr: "شارع الجلاء", nameEn: "Gala'a Street", slug: "galaa-zagazig" },
    {
      nameAr: "شارع الشيراتون",
      nameEn: "Sheraton Street",
      slug: "sheraton-zagazig",
    },
  ],
  "port-said": [
    {
      nameAr: "شارع الجمهورية",
      nameEn: "El Gomhuria Street",
      slug: "gomhuria-port-said",
    },
    {
      nameAr: "شارع الشيراتون",
      nameEn: "Sheraton Port Said",
      slug: "sheraton-port-said",
    },
    { nameAr: "المندرة", nameEn: "El Mandara", slug: "el-mandara-port-said" },
  ],
  ismailia: [
    {
      nameAr: "شارع سعد زغلول",
      nameEn: "Saad Zaghloul Street",
      slug: "saad-zaghloul",
    },
    {
      nameAr: "شارع puberty",
      nameEn: "El Gomhuria Street Ismailia",
      slug: "gomhuria-ismailia",
    },
  ],
  "el-dahar": [
    { nameAr: "الدهار", nameEn: "El Dahar", slug: "el-dahar-area" },
    {
      nameAr: "شارع الشيراتون",
      nameEn: "Sheraton Hurghada",
      slug: "sheraton-hurghada",
    },
  ],
  "hurghada-el-gouna": [
    {
      nameAr: "الجونة",
      nameEn: "El Gouna Hurghada",
      slug: "el-gouna-hurghada",
    },
  ],
  elephantine: [
    {
      nameAr: "جزيرة الفنتين",
      nameEn: "Elephantine Island",
      slug: "elephantine-island",
    },
    { nameAr: "أسوان الجديدة", nameEn: "New Aswan", slug: "new-aswan" },
  ],
  "fayoum-city": [
    { nameAr: "وسط فيوم", nameEn: "Fayoum Center", slug: "fayoum-center" },
    {
      nameAr: "شارع البريد",
      nameEn: "El Barid Street",
      slug: "el-barid-fayoum",
    },
  ],
  "beni-suef-city": [
    {
      nameAr: "وسط بني سويف",
      nameEn: "Beni Suef Center",
      slug: "beni-suef-center",
    },
    {
      nameAr: "شارع الكورنيش",
      nameEn: "Corniche Beni Suef",
      slug: "corniche-beni-suef",
    },
  ],
  "minya-city": [
    { nameAr: "وسط المنيا", nameEn: "Minya Center", slug: "minya-center" },
    {
      nameAr: "شارع الكورنيش",
      nameEn: "Corniche Minya",
      slug: "corniche-minya",
    },
  ],
  banha: [
    { nameAr: "وسط بنها", nameEn: "Banha Center", slug: "banha-center" },
    {
      nameAr: "شارع المحطة",
      nameEn: "El Mahatta Street Banha",
      slug: "el-mahatta-banha",
    },
  ],
  qalyub: [
    {
      nameAr: "شارع القليوبية",
      nameEn: "Qalyub Street",
      slug: "qalyub-street",
    },
  ],
  "10th-of-ramadan": [
    {
      nameAr: "العاشر من رمضان",
      nameEn: "10th of Ramadan City",
      slug: "10th-ramadan-center",
    },
    {
      nameAr: "المنطقة الصناعية",
      nameEn: "Industrial Area",
      slug: "industrial-10th",
    },
  ],
  damanhur: [
    {
      nameAr: "وسط دمنهور",
      nameEn: "Damanhur Center",
      slug: "damanhur-center",
    },
  ],
  "kafr-el-sheikh": [
    {
      nameAr: "وسط كفر الشيخ",
      nameEn: "Kafr El Sheikh Center",
      slug: "kafr-el-sheikh-center",
    },
  ],
  damietta: [
    { nameAr: "وسط دمياط", nameEn: "Damietta Center", slug: "damietta-center" },
    {
      nameAr: "شارع راس البر",
      nameEn: "Ras El Bar Street",
      slug: "ras-el-bar",
    },
  ],
  "luxor-city": [
    { nameAr: "وسط الأقصر", nameEn: "Luxor Center", slug: "luxor-center" },
    { nameAr: "الكرنك", nameEn: "El Karnak", slug: "el-karnak" },
  ],
  "el-zafarana": [
    { nameAr: "الزفتاري", nameEn: "El Zafarana", slug: "el-zafarana-area" },
  ],
  "ain-sokhna-city": [
    { nameAr: "العين السخنة", nameEn: "Ain Sokhna", slug: "ain-sokhna-area" },
  ],
  "gulf-of-suez": [
    {
      nameAr: "خليج السويس",
      nameEn: "Gulf of Suez",
      slug: "gulf-of-suez-area",
    },
  ],
  "south-alamein": [
    {
      nameAr: "العلمين الجنوبية",
      nameEn: "South Alamein",
      slug: "south-alamein-area",
    },
  ],
  "north-west": [
    {
      nameAr: "الnorth west",
      nameEn: "North West Coast",
      slug: "north-west-area",
    },
  ],
  tullumbat: [
    { nameAr: "الطلبات", nameEn: "Tullumbat", slug: "tullumbat-area" },
  ],
  akhbarak: [{ nameAr: "الأكشاك", nameEn: "Akhbarak", slug: "akhbarak-area" }],
  "al-mamsha": [
    { nameAr: "المنشية", nameEn: "Al Mamsha", slug: "al-mamsha-area" },
  ],
  asafra: [{ nameAr: "العصافرة", nameEn: "Asafra", slug: "asafra-area" }],
  stanley: [{ nameAr: "ستانلي", nameEn: "Stanley", slug: "stanley-area" }],
  "fouad-street": [
    { nameAr: "شارع فؤاد", nameEn: "Fouad Street", slug: "fouad-street-area" },
  ],
  marina: [{ nameAr: "مارينا", nameEn: "Marina", slug: "marina-area" }],
  "hyde-park": [
    { nameAr: "هايد بارك", nameEn: "Hyde Park", slug: "hyde-park-area" },
  ],
  talbiya: [{ nameAr: "الطالبية", nameEn: "Talbiya", slug: "talbiya-area" }],
  orouba: [{ nameAr: "الوريمال", nameEn: "Orouba", slug: "orouba-area" }],
  kardasa: [{ nameAr: "كرداسة", nameEn: "Kardasa", slug: "kardasa-area" }],
  "abu-rawash": [
    { nameAr: "أبو رواش", nameEn: "Abu Rawash", slug: "abu-rawash-area" },
  ],
  saf: [{ nameAr: "الصف", nameEn: "Saf", slug: "saf-area" }],
};

async function seedNeighborhoods() {
  let count = 0;
  for (const [citySlug, neighborhoods] of Object.entries(neighborhoodsByCity)) {
    const city = await prisma.city.findUnique({ where: { slug: citySlug } });
    if (!city) {
      console.log(`City ${citySlug} not found, skipping neighborhoods.`);
      continue;
    }

    for (const neighborhood of neighborhoods) {
      await prisma.neighborhood.upsert({
        where: { slug: neighborhood.slug },
        update: {
          nameAr: neighborhood.nameAr,
          nameEn: neighborhood.nameEn,
          cityId: city.id,
          isActive: true,
        },
        create: { ...neighborhood, cityId: city.id, isActive: true },
      });
      count++;
    }
  }
  console.log(`Neighborhoods seeded: ${count}.`);
}

async function main() {
  await seedRegions();
  await seedCities();
  await seedNeighborhoods();
  await seedCategories();
  await seedAmenities();
  await seedSuperAdmin();
  await seedFeatureFlags();
  await seedDemoProperties();

  const [
    regionCount,
    cityCount,
    neighborhoodCount,
    categoryCount,
    typeCount,
    amenityCount,
    featureFlagCount,
    propertyCount,
  ] = await Promise.all([
    prisma.region.count(),
    prisma.city.count(),
    prisma.neighborhood.count(),
    prisma.propertyCategory.count(),
    prisma.propertyType.count(),
    prisma.amenity.count(),
    prisma.featureFlag.count(),
    prisma.property.count(),
  ]);

  console.log(
    `Seed complete: ${regionCount} regions, ${cityCount} cities, ${neighborhoodCount} neighborhoods, ${categoryCount} categories, ${typeCount} property types, ${amenityCount} amenities, ${featureFlagCount} feature flags, ${propertyCount} properties.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
