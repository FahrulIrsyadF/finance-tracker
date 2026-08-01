import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_MODELS = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", rpm: 15, rpd: 500 },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", rpm: 15, rpd: 500 },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", rpm: 10, rpd: 20 },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]["id"];

export interface AITransaction {
  date: string;        // YYYY-MM-DD
  note: string;
  type: "income" | "expense";
  amount: number;
  categoryName?: string;
}

export async function parseTransactionsFromText(
  text: string,
  today: string, // YYYY-MM-DD
  categoryNames: string[],
  modelId: string
): Promise<AITransaction[]> {
  const model = genAI.getGenerativeModel({ model: modelId });

  const prompt = `
Kamu adalah asisten pencatatan keuangan. Tugasmu adalah mengekstrak semua transaksi dari teks bebas yang ditulis dalam Bahasa Indonesia atau bahasa gaul.

Tanggal hari ini: ${today}

Daftar kategori yang tersedia (gunakan HANYA nama kategori dari daftar ini jika cocok):
${categoryNames.join(", ")}

Aturan konversi nominal:
- "rb", "ribu" = x1.000 (contoh: 25rb = 25000)
- "k" setelah angka = x1.000 (contoh: 50k = 50000)
- "jt", "juta" = x1.000.000
- "perak" = nilai sebenarnya (5 perak = 5)
- Jika tidak ada satuan, anggap nilai tersebut sudah dalam Rupiah

Aturan tanggal:
- "tadi", "tadi pagi", "tadi malam", "tadi siang", "barusan" = tanggal hari ini (${today})
- "kemarin" = satu hari sebelum hari ini
- "kemarin lusa" = dua hari sebelum hari ini
- "minggu lalu" = 7 hari sebelum hari ini
- "tanggal X" = tanggal X di bulan saat ini
- Jika tidak ada keterangan waktu, gunakan hari ini

Aturan tipe transaksi:
- Kata "beli", "bayar", "belanja", "keluar", "habis", "kepake", "jajan" = "expense"
- Kata "terima", "dapet", "dapat", "gajian", "masuk", "dibayar", "dijual", "nerima" = "income"
- Jika ambigu, default = "expense"

Kembalikan HANYA array JSON tanpa teks lain, tanpa markdown, tanpa penjelasan. Format:
[{"date":"YYYY-MM-DD","note":"keterangan singkat yang sudah dirapikan","type":"expense|income","amount":nominalAngka,"categoryName":"nama kategori atau null"}]

Teks input:
"${text.replace(/"/g, "'")}"
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Sanitize: strip possible markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Response is not an array");

    return parsed.map((item: Record<string, unknown>) => ({
      date: typeof item.date === "string" ? item.date : today,
      note: typeof item.note === "string" ? item.note : "Transaksi",
      type: item.type === "income" ? "income" : "expense",
      amount: typeof item.amount === "number" ? Math.abs(item.amount) : 0,
      categoryName: typeof item.categoryName === "string" && item.categoryName !== "null" ? item.categoryName : undefined,
    }));
  } catch {
    throw new Error("Gemini mengembalikan format yang tidak valid. Coba ulangi lagi.");
  }
}
