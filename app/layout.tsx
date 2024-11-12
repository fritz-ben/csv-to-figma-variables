import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { Toaster } from "sonner";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "CSV to Figma variables 🪄",
  description: "Magic converter: From CSV to Figma design tokens in one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${syne.variable}`}>
        {children}
        <Toaster expand={true} />
      </body>
    </html>
  );
}
