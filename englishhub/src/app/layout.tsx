import type { Metadata } from "next";
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { TooltipProvider } from "@/components/ui/tooltip";
import { preferencesStorageKey } from '@/lib/preferences'
import "./globals.css";

export const metadata: Metadata = {
  title: "HavenLanguage — Gestiona tus clases de inglés",
  description: "Plataforma para profesores de inglés independientes. Gestión de estudiantes, lecciones interactivas, tareas, pagos y agenda.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} data-palette="teal" data-mode="light" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="havenlanguage-theme-init" strategy="beforeInteractive">
          {`try{const raw=localStorage.getItem('${preferencesStorageKey}');if(raw){const p=JSON.parse(raw);if(p?.palette)document.documentElement.dataset.palette=p.palette;if(p?.mode){document.documentElement.dataset.mode=p.mode;document.documentElement.classList.toggle('dark',p.mode==='dark');}}}catch{}`}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
