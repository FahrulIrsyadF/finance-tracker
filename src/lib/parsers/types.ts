export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  amount: number;
  type: "income" | "expense";
  note: string;
  categoryName?: string;
}

export interface ParseResult {
  bank: "BCA" | "Jago" | "Unknown";
  transactions: ParsedTransaction[];
}
