// Format a number as BDT currency string
export const formatBDT = (n, locale = "bn-BD") =>
  `৳${Number(n).toLocaleString(locale)}`;

// Format a number as Bengali numerals
export const toBanglaNum = (n) =>
  String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

// Get days between two date strings
export const daysBetween = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
};

// Truncate a string with ellipsis
export const truncate = (str, max = 30) =>
  str.length > max ? str.slice(0, max) + "…" : str;

// Generate a unique tag ID (TAG-XXX)
export const generateTagId = (existing = []) => {
  const nums = existing
    .map((t) => parseInt(t.replace("TAG-", ""), 10))
    .filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `TAG-${String(next).padStart(3, "0")}`;
};
