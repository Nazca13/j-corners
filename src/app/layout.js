import "./globals.css";
import { Poppins } from "next/font/google";
import NavBar from "@/components/NavBar";
import LayoutShell from "@/components/LayoutShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  title: "J-Corners | Food & Coffee Delivery",
  description: "Pesan makanan dan kopi favoritmu dari J-Corners! Fresh baked, premium coffee, dan menu pilihan setiap hari.",
  keywords: "j-corners, food delivery, coffee, bakery, pesan makanan",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "J-Corners | Food & Coffee Delivery",
    description: "Fresh bakery & premium coffee, delivered to you.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${poppins.variable} bg-[#E8E6E3]`} suppressHydrationWarning>
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}