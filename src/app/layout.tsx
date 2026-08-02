import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import NextTopLoader from "nextjs-toploader";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Exspend",
    template: "%s | Exspend",
  },
  description: "Catat setiap rupiah. Kenali polamu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={geist.className}>
        <NextTopLoader color="#10b981" showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
