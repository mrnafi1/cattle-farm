export const mockCattle = [
  {
    id: "1",
    tagId: "TAG-001",
    name: "কালো মতি",
    breed: "শাহীওয়াল",
    type: "dairy",
    age: 4,
    weight: [
      { date: "2025-01-01", value: 320 },
      { date: "2025-02-01", value: 335 },
      { date: "2025-03-01", value: 348 },
      { date: "2025-04-01", value: 362 },
      { date: "2025-05-01", value: 375 },
      { date: "2025-06-01", value: 381 },
    ],
    purchaseDate: "2024-03-15",
    purchasePrice: 85000,
    status: "healthy",
    vaccineHistory: [
      { name: "FMD টিকা", date: "2025-01-10", nextDue: "2025-07-10" },
      { name: "HS টিকা", date: "2025-02-05", nextDue: "2025-08-05" },
    ],
    notes: "দৈনিক গড়ে ১২ লিটার দুধ দেয়",
  },
  {
    id: "2",
    tagId: "TAG-002",
    name: "লাল বাহাদুর",
    breed: "ব্রাহমান",
    type: "fattening",
    age: 2,
    weight: [
      { date: "2025-01-01", value: 180 },
      { date: "2025-02-01", value: 205 },
      { date: "2025-03-01", value: 228 },
      { date: "2025-04-01", value: 255 },
      { date: "2025-05-01", value: 278 },
      { date: "2025-06-01", value: 302 },
    ],
    purchaseDate: "2024-11-20",
    purchasePrice: 55000,
    status: "healthy",
    vaccineHistory: [
      { name: "FMD টিকা", date: "2025-03-01", nextDue: "2025-09-01" },
    ],
    notes: "ওজন বৃদ্ধি ভালো",
  },
  {
    id: "3",
    tagId: "TAG-003",
    name: "সাদা তারা",
    breed: "হলস্টেইন",
    type: "dairy",
    age: 5,
    weight: [
      { date: "2025-01-01", value: 410 },
      { date: "2025-02-01", value: 415 },
      { date: "2025-03-01", value: 412 },
      { date: "2025-04-01", value: 418 },
    ],
    purchaseDate: "2023-06-10",
    purchasePrice: 120000,
    status: "sick",
    vaccineHistory: [
      { name: "FMD টিকা", date: "2025-01-15", nextDue: "2025-07-15" },
    ],
    notes: "সামান্য জ্বর আছে, চিকিৎসা চলছে",
  },
  {
    id: "4",
    tagId: "TAG-004",
    name: "কোরবানি ষাঁড়",
    breed: "দেশি",
    type: "fattening",
    age: 3,
    weight: [
      { date: "2025-02-01", value: 290 },
      { date: "2025-03-01", value: 318 },
      { date: "2025-04-01", value: 345 },
      { date: "2025-05-01", value: 372 },
      { date: "2025-06-01", value: 398 },
    ],
    purchaseDate: "2025-01-05",
    purchasePrice: 70000,
    status: "forSale",
    vaccineHistory: [
      { name: "FMD টিকা", date: "2025-02-10", nextDue: "2025-08-10" },
    ],
    notes: "বিক্রয়ের জন্য প্রস্তুত",
  },
];

export const mockMilkLogs = [
  { id: "1", date: "2025-06-20", produced: 48, sold: 40, pricePerLiter: 70 },
  { id: "2", date: "2025-06-19", produced: 52, sold: 45, pricePerLiter: 70 },
  { id: "3", date: "2025-06-18", produced: 46, sold: 46, pricePerLiter: 70 },
  { id: "4", date: "2025-06-17", produced: 50, sold: 42, pricePerLiter: 70 },
  { id: "5", date: "2025-06-16", produced: 55, sold: 50, pricePerLiter: 70 },
  { id: "6", date: "2025-06-15", produced: 49, sold: 44, pricePerLiter: 70 },
  { id: "7", date: "2025-06-14", produced: 53, sold: 48, pricePerLiter: 70 },
];

export const mockExpenses = [
  { id: "1", date: "2025-06-01", category: "feed", amount: 12000, description: "গমের ভুসি ও খড়" },
  { id: "2", date: "2025-06-03", category: "medical", amount: 2500, description: "TAG-003 চিকিৎসা" },
  { id: "3", date: "2025-06-05", category: "labor", amount: 8000, description: "জুন মাসের বেতন" },
  { id: "4", date: "2025-06-10", category: "electricity", amount: 1800, description: "বিদ্যুৎ বিল" },
  { id: "5", date: "2025-06-12", category: "feed", amount: 9500, description: "কাঁচা ঘাস ও সাইলেজ" },
  { id: "6", date: "2025-06-15", category: "other", amount: 3200, description: "মেরামত ও রক্ষণাবেক্ষণ" },
  { id: "7", date: "2025-06-18", category: "medical", amount: 1200, description: "ভিটামিন সাপ্লিমেন্ট" },
];

export const mockIncomes = [
  { id: "1", date: "2025-06-01", source: "milk", amount: 21000, description: "জুন ১ম সপ্তাহ দুধ বিক্রি" },
  { id: "2", date: "2025-06-08", source: "milk", amount: 22400, description: "জুন ২য় সপ্তাহ দুধ বিক্রি" },
  { id: "3", date: "2025-06-15", source: "milk", amount: 20300, description: "জুন ৩য় সপ্তাহ দুধ বিক্রি" },
];

export const mockMonthlyChart = [
  { month: "জানু", income: 85000, expense: 42000 },
  { month: "ফেব্রু", income: 92000, expense: 45000 },
  { month: "মার্চ", income: 88000, expense: 48000 },
  { month: "এপ্রিল", income: 95000, expense: 43000 },
  { month: "মে", income: 102000, expense: 47000 },
  { month: "জুন", income: 63700, expense: 38200 },
];

export const mockUsers = [
  { id: "1", name: "মোহাম্মদ রহিম", role: "admin", pin: "1234" },
  { id: "2", name: "করিম মিয়া", role: "worker", pin: "5678" },
  { id: "3", name: "শেয়ারহোল্ডার আলী", role: "shareholder", pin: "9012" },
];
