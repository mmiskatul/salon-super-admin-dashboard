import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/common/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Super Admin Dashboard - Financial & Payroll Management",
  description: "A premium, responsive dashboard for super admins to manage salon payroll, pending taxes, budgeting, and compliance analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <title>Super Admin Dashboard - Financial & Payroll Management</title>
      </head>
      <body className="min-h-full bg-bg-main text-slate-800">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:p-4 focus:bg-white focus:absolute focus:z-50">
          Skip to main content
        </a>
        <h1 className="sr-only">Super Admin Dashboard</h1>
        <main id="main-content" className="h-full">
          <DashboardLayout>{children}</DashboardLayout>
        </main>
      </body>
    </html>
  );
}
