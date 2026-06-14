import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter (texto) + Poppins (títulos). Nunito é carregada só para os
            dígitos via @font-face em globals.css. O <link> no <head> do root
            layout é o padrão do App Router; a regra abaixo só vale p/ Pages. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
