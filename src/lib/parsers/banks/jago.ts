import { ParsedTransaction } from "../types";

export function parseJago(text: string): ParsedTransaction[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];
  
  let currentTx: string[] = [];
  
  for (const line of lines) {
    if (/^\d{2}\s+[a-zA-Z]{3}\s+\d{4}$/.test(line)) {
      if (currentTx.length > 0) {
        processJagoTransaction(currentTx, transactions);
      }
      currentTx = [line];
    } else if (currentTx.length > 0) {
      if (line.includes("Halaman") && line.includes("dari")) {
        // skip headers
      } else {
        currentTx.push(line);
        // End of transaction is typically [+-]AmountBalance,xx
        // It always ends with a comma and two digits.
        if (/[+-][\d.]+,?\d*$/.test(line) && line.includes(",")) {
          processJagoTransaction(currentTx, transactions);
          currentTx = [];
        }
      }
    }
  }
  
  if (currentTx.length > 0) {
    processJagoTransaction(currentTx, transactions);
  }
  
  return transactions;
}

function processJagoTransaction(lines: string[], results: ParsedTransaction[]) {
  if (lines.length < 3) return;
  const dateStr = lines[0];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = dateStr.split(/\s+/);
  const dd = parts[0].padStart(2, "0");
  const mm = String(monthNames.indexOf(parts[1]) + 1).padStart(2, "0");
  const yyyy = parts[2];
  const date = `${yyyy}-${mm}-${dd}`;

  const lastLine = lines[lines.length - 1];
  
  // Example: +3.000.0003.012.197,36
  // We know balance ends with ,\d{2} and usually amount has dots.
  // We can match greedily on amount since balance usually doesn't have multiple commas.
  // Actually, split by comma. The last part is the decimal of balance.
  // e.g. +3.000.0003.012.197,36 -> +3.000.000 and 3.012.197,36
  // Jago amount doesn't have decimals unless it's tax/interest (e.g. +520,2114.946,57)
  // Let's use a simpler approach: extract type (+/-) at the start of the string,
  // then we have a sequence of digits, dots, and maybe commas.
  let amount = 0;
  let type: "income" | "expense" = "expense";

  const match = lastLine.match(/^([+-])(.*)$/);
  if (match) {
    type = match[1] === "+" ? "income" : "expense";
    const rest = match[2];
    
    // The balance part always looks like: [digits or dots], [2 digits]
    // So the balance matches: ([\d.]+,\d{2})$
    const balanceMatch = rest.match(/([\d.]+,\d{2})$/);
    if (balanceMatch) {
      const balanceStr = balanceMatch[1];
      let amtStr = rest.substring(0, rest.length - balanceStr.length);
      
      // now amtStr is e.g. "3.000.000" or "520,21"
      amtStr = amtStr.replace(/\./g, "").replace(/,/g, ".");
      amount = parseFloat(amtStr);
    } else {
      // fallback
      let amtStr = rest.replace(/\./g, "").replace(/,/g, ".");
      amount = parseFloat(amtStr);
    }
  }

  let descLines = lines.slice(2, lines.length - 1);
  let desc = descLines.join(" ");
  // replace tabs with spaces
  desc = desc.replace(/\t/g, " ");

  // Kategori Heuristik
  let categoryName = "";
  let noteUpper = desc.toUpperCase();
  if (noteUpper.includes("BIAYA ADM") || noteUpper.includes("ADMIN")) {
    categoryName = "Biaya Admin";
  } else if (noteUpper.includes("BUNGA") && !noteUpper.includes("PAJAK")) {
    categoryName = "Pendapatan Bunga";
  } else if (noteUpper.includes("PAJAK BUNGA") || noteUpper.includes("TAX")) {
    categoryName = "Pajak";
  }

  results.push({
    date,
    amount,
    type,
    note: desc,
    categoryName: categoryName || undefined
  });
}
