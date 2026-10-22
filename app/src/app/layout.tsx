import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'JELOUE — Location de véhicules en Guyane',
  description: 'La marketplace de location de véhicules en Guyane française. Trouvez voitures, 4x4, motos et utilitaires auprès de loueurs locaux à Cayenne, Kourou, Saint-Laurent-du-Maroni et partout en Guyane.',
  keywords: 'location voiture Guyane, louer véhicule Cayenne, location 4x4 Guyane, JELOUE',
  openGraph: {
    title: 'JELOUE — Location de véhicules en Guyane',
    description: 'Trouvez le véhicule qu\'il vous faut en Guyane française',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
