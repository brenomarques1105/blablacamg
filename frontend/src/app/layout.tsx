import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlablaCAMG | Caronas da Cidade Administrativa",
  description:
    "Encontre ou ofereça caronas entre servidores da Cidade Administrativa de Minas Gerais.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
