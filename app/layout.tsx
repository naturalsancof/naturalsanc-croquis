import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const body = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Naturalsanc Croquis · 个人数字工作室",
    template: "%s · Naturalsanc Croquis",
  },
  description:
    "一个记录「正在进行的追求」的数字工作室：摄影、界面实验、城市声音，以及它们留下的草稿。",
  openGraph: {
    type: "website",
    siteName: "Naturalsanc Croquis",
    title: "Naturalsanc Croquis · 个人数字工作室",
    description:
      "记录正在学、正在做、正在卡住的事情。摄影、界面实验与城市声音。",
  },
  other: {
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3edf6",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${display.variable} ${body.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-dvh flex-col">
        <div className="page-grid" aria-hidden />
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 sm:px-8 sm:pt-14">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
