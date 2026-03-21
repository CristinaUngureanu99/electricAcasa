import Link from 'next/link';
import { site } from '@/config/site';
import { Mail, Phone } from 'lucide-react';

interface ShopFooterProps {
  categories: { id: string; name: string; slug: string }[];
}

export function ShopFooter({ categories }: ShopFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Categorii */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categorii</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categorie/${cat.slug}`} className="text-sm hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-sm text-gray-500">Nicio categorie</li>
              )}
            </ul>
          </div>

          {/* Cont */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contul meu</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm hover:text-white transition-colors">
                  Autentificare
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm hover:text-white transition-colors">
                  Inregistrare
                </Link>
              </li>
            </ul>
          </div>

          {/* Servicii */}
          <div>
            <h3 className="text-white font-semibold mb-4">Servicii</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/generator-pachet" className="text-sm hover:text-white transition-colors">
                  Generator pachet
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-gray-500" />
                <a href={`mailto:${site.contact.email}`} className="hover:text-white transition-colors">
                  {site.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-gray-500" />
                <a href={`tel:${site.contact.phone}`} className="hover:text-white transition-colors">
                  {site.contact.phone}
                </a>
              </li>
            </ul>
          </div>

          {/* Brand */}
          <div>
            <h3 className="text-white font-semibold mb-4">{site.name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {site.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {year} {site.name}. Toate drepturile rezervate.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Termeni si conditii</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Confidentialitate</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
