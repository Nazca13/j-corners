import "./globals.css";
import { Poppins } from "next/font/google";
import NavBar from "@/components/NavBar";

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
      <body className={`${poppins.variable} bg-[#E8E6E3] flex justify-center`} suppressHydrationWarning>
        {/* Mobile App Shell */}
        <div className="w-full max-w-md min-h-screen bg-bg relative shadow-2xl overflow-x-hidden border-x border-border">
          {children}
          <NavBar />
        </div>
      </body>
    </html>
  );
}