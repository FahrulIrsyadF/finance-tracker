// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { parseBCA } from "./banks/bca";
import { parseJago } from "./banks/jago";
import { parseBRI } from "./banks/bri";
import { ParseResult } from "./types";

export async function parsePDFBuffer(buffer: Buffer): Promise<ParseResult> {
  const data = await pdf(buffer);
  const text = data.text;

  const bcaKeywords = ["REKENING TAHAPAN", "BCA", "KCP"];
  const jagoKeywords = ["Bank Jago", "Pockets Transactions", "Jago"];
  const briKeywords = ["BANK BRI", "BRIMO", "BRIMo", "LAPORAN TRANSAKSI FINANSIAL", "StatementBRImo"];

  let bank: ParseResult["bank"] = "Unknown";
  
  if (bcaKeywords.some(k => text.includes(k))) {
    bank = "BCA";
  } else if (jagoKeywords.some(k => text.includes(k))) {
    bank = "Jago";
  } else if (briKeywords.some(k => text.includes(k))) {
    bank = "BRI";
  }

  if (bank === "BCA") {
    return {
      bank,
      transactions: parseBCA(text)
    };
  } else if (bank === "Jago") {
    return {
      bank,
      transactions: parseJago(text)
    };
  } else if (bank === "BRI") {
    return {
      bank,
      transactions: parseBRI(text)
    };
  }

  return { bank, transactions: [] };
}
