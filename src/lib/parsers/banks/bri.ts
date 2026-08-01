import { ParsedTransaction } from "../types";

export function parseBRI(text: string): ParsedTransaction[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    // Check if line starts with DD/MM/YY HH:MM:SS
    const dateMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+\d{2}:\d{2}:\d{2}\s*(.*)/);
    if (dateMatch) {
      const dd = dateMatch[1];
      const mm = dateMatch[2];
      const yy = dateMatch[3];
      const fullYear = parseInt(yy) < 50 ? `20${yy}` : `19${yy}`;
      const date = `${fullYear}-${mm}-${dd}`;

      const rest = dateMatch[4];

      // Money amounts have format like 6,500.00 or 0.00
      const moneyRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
      const matches = [...rest.matchAll(moneyRegex)];

      if (matches.length >= 3) {
        const debetStr = matches[matches.length - 3][1];
        const kreditStr = matches[matches.length - 2][1];

        const debet = parseFloat(debetStr.replace(/,/g, ""));
        const kredit = parseFloat(kreditStr.replace(/,/g, ""));

        // Description is everything before the first of the 3 money matches
        const firstMoneyIdx = rest.indexOf(debetStr);
        let note = rest.substring(0, firstMoneyIdx).trim();
        note = note.replace(/\t/g, " ");

        const type: "income" | "expense" = debet > 0 ? "expense" : "income";
        const amount = debet > 0 ? debet : kredit;

        if (amount === 0) continue; // Skip zero-amount transactions if any

        // Auto-kategori Heuristik
        let categoryName = "";
        const noteUpper = note.toUpperCase();
        if (noteUpper.includes("ADMIN") || noteUpper.includes("FEE") || noteUpper.includes("BIAYA")) {
          categoryName = "Biaya Admin";
        } else if (noteUpper.includes("BUNGA") && !noteUpper.includes("PAJAK")) {
          categoryName = "Pendapatan Bunga";
        } else if (noteUpper.includes("PAJAK") || noteUpper.includes("TAX")) {
          categoryName = "Pajak";
        }

        transactions.push({
          date,
          amount,
          type,
          note,
          categoryName: categoryName || undefined
        });
      }
    }
  }

  return transactions;
}
