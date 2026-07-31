// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { parseBCA } from "./banks/bca";
import { parseJago } from "./banks/jago";
import { ParseResult } from "./types";

export async function parsePDFBuffer(buffer: Buffer): Promise<ParseResult> {
  const data = await pdf(buffer);
  const text = data.text;

  const bcaKeywords = ["REKENING TAHAPAN", "BCA", "KCP"];
  const jagoKeywords = ["Bank Jago", "Pockets Transactions", "Jago"];

  let bank: ParseResult["bank"] = "Unknown";
  
  if (bcaKeywords.some(k => text.includes(k))) {
    bank = "BCA";
  } else if (jagoKeywords.some(k => text.includes(k))) {
    bank = "Jago";
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
  }

  return { bank, transactions: [] };
}
