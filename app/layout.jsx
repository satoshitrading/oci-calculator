import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'OCI Price Calculator',
  description: 'Calculate Oracle Cloud Infrastructure costs and generate proposals',
  icons: {
    icon: '/nimbus-logo.png',
    shortcut: '/nimbus-logo.png',
    apple: '/nimbus-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-full font-sans antialiased ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
