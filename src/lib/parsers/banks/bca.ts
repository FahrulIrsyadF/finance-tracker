import { ParsedTransaction } from "../types";

export function parseBCA(text: string): ParsedTransaction[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  
  let currentTx: string[] = [];
  
  let year = new Date().getFullYear();
  const periodLine = lines.find(l => l.startsWith("PERIODE:"));
  if (periodLine) {
    const match = periodLine.match(/\d{4}/);
    if (match) year = parseInt(match[0]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (/^\d{2}\/\d{2}/.test(line) && line !== "00/00") {
      if (currentTx.length > 0) {
        processBCATransaction(currentTx, year, transactions);
      }
      currentTx = [line];
    } else if (currentTx.length > 0) {
      if (line.includes("Bersambung ke halaman berikut") || line.startsWith("REKENING TAHAPAN") || line.startsWith("SALDO AWAL:")) {
        processBCATransaction(currentTx, year, transactions);
        currentTx = [];
        if (line.startsWith("SALDO AWAL:")) break; // end of transactions
      } else {
        currentTx.push(line);
      }
    }
  }
  
  if (currentTx.length > 0) {
    processBCATransaction(currentTx, year, transactions);
  }
  
  return transactions;
}

function processBCATransaction(lines: string[], year: number, results: ParsedTransaction[]) {
  if (lines.length === 0) return;
  const firstLine = lines[0];
  
  const dateStr = firstLine.substring(0, 5);
  const [dd, mm] = dateStr.split("/");
  const date = `${year}-${mm}-${dd}`;
  
  let desc = lines.join(" ").substring(5).trim();
  if (desc.startsWith("SALDO AWAL")) return; // skip initial balance
  
  const lastLine = lines[lines.length - 1];
  
  // Safe extraction looking at DB or end of line
  let amount = 0;
  let isExpense = false;

  const dbMatch = lastLine.match(/(\d{1,3}(?:,\d{3})*\.\d{2})DB/);
  if (dbMatch) {
    amount = parseFloat(dbMatch[1].replace(/,/g, ""));
    isExpense = true;
    desc = desc.replace(dbMatch[0] + ".*", "").trim();
    // remove any trailing numbers that glued (like the 0998 in 099810,000.00DB)
    desc = desc.replace(/\d+$/, "").trim();
  } else {
    // Possibly income, usually ends with Amount + Balance
    // e.g. 15,000.00202,933.10
    const moneyRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
    const matches = [...lastLine.matchAll(moneyRegex)];
    if (matches.length > 0) {
      // The amount is the first match of the money sequence at the end
      amount = parseFloat(matches[0][1].replace(/,/g, ""));
      desc = desc.replace(matches[0][1] + ".*", "").trim();
      desc = desc.replace(/\d+$/, "").trim();
    }
  }

  // Basic heuristik kategorisasi
  let categoryName = "";
  let noteUpper = desc.toUpperCase();
  if (noteUpper.includes("BIAYA ADM") || noteUpper.includes("ADMIN")) {
    categoryName = "Biaya Admin";
  } else if (noteUpper.includes("BUNGA")) {
    categoryName = "Pendapatan Bunga";
  } else if (noteUpper.includes("PAJAK BUNGA") || noteUpper.includes("TAX")) {
    categoryName = "Pajak";
  }

  results.push({
    date,
    amount,
    type: isExpense ? "expense" : "income",
    note: desc,
    categoryName: categoryName || undefined
  });
}
