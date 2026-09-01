import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'GRUPO SENAGRO - ERP Industrial & Gestão Integrada',
  description: 'Sistema ERP Industrial Multiempresa do GRUPO SENAGRO.',
  openGraph: {
    title: 'GRUPO SENAGRO - ERP Industrial & Gestão Integrada',
    description: 'Sistema ERP Industrial Multiempresa do GRUPO SENAGRO.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GRUPO SENAGRO - ERP Industrial & Gestão Integrada',
    description: 'Sistema ERP Industrial Multiempresa do GRUPO SENAGRO.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
