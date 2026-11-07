import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaCare RO Pro - Multi-Brand Water Purifier Service & CRM",
  description: "Production-ready management web application for RO Water Filter Service, Customer Management, Automatic Due Reminders, and Spare Parts Inventory.",
  keywords: ["RO Service", "Water Purifier CRM", "Kent RO Service", "Aquaguard Service", "Service Due WhatsApp", "RO Spare Parts"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
