import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Beautly — Agendamento online para profissionais de beleza",
    template: "%s · Beautly",
  },
  description:
    "Agenda online simples para manicures, lash designers, sobrancelhas e outras profissionais de estética. Suas clientes agendam sozinhas, você só atende.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${dmSans.variable} ${fraunces.variable}`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
