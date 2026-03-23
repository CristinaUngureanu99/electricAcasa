import Link from 'next/link';
import { site } from '@/config/site';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = {
  title: 'Intrebari frecvente',
  description:
    'Raspunsuri la cele mai frecvente intrebari despre comenzi, livrare, plata si returnare pe electricAcasa.ro.',
};

const faqs = [
  {
    category: 'Comenzi si plata',
    items: [
      {
        q: 'Ce metode de plata acceptati?',
        a: 'Acceptam plata ramburs (la livrare). Plata cu cardul va fi disponibila in curand.',
      },
      {
        q: 'Pot anula o comanda?',
        a: 'Da, poti anula o comanda ramburs cat timp este in stadiul "In asteptare" sau "Confirmata". Acceseaza sectiunea Comenzi din contul tau.',
      },
      {
        q: 'Cum primesc factura?',
        a: 'Factura se emite automat si o primesti pe email dupa confirmarea comenzii.',
      },
    ],
  },
  {
    category: 'Livrare',
    items: [
      {
        q: 'Cat costa livrarea?',
        a: `Livrarea costa ${site.shipping.fixedCost} RON. Pentru comenzi peste ${site.shipping.freeThreshold} RON, livrarea este gratuita.`,
      },
      {
        q: 'In cat timp primesc comanda?',
        a: 'Comenzile sunt procesate in 1-2 zile lucratoare. Livrarea dureaza 1-3 zile lucratoare suplimentare, in functie de zona.',
      },
      { q: 'Livrati in toata Romania?', a: 'Da, livram in toata Romania prin curier.' },
    ],
  },
  {
    category: 'Retururi',
    items: [
      {
        q: 'Pot returna un produs?',
        a: 'Da, ai dreptul de retragere in 14 zile calendaristice de la primire. Produsul trebuie sa fie nefolosit, in ambalajul original.',
      },
      {
        q: 'Cine suporta costul returului?',
        a: 'Costul de expeditie pentru retur este suportat de cumparator, cu exceptia produselor defecte sau gresite.',
      },
    ],
  },
  {
    category: 'Cont si date',
    items: [
      {
        q: 'Trebuie sa am cont pentru a comanda?',
        a: 'Da, ai nevoie de un cont pentru a plasa o comanda. Inregistrarea dureaza sub un minut.',
      },
      {
        q: 'Cum imi sterg contul?',
        a: 'Poti sterge contul din pagina de Profil. Toate datele tale vor fi eliminate permanent.',
      },
    ],
  },
  {
    category: 'Pachet personalizat',
    items: [
      {
        q: 'Ce este generatorul de pachete?',
        a: 'Este un formular prin care ne spui ce proiect ai (apartament, casa, spatiu comercial) si noi iti pregatim o oferta completa cu toate materialele necesare.',
      },
      {
        q: 'Cat costa consultanta?',
        a: 'Consultanta si oferta personalizata sunt gratuite. Platesti doar produsele pe care le comanzi.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Intrebari frecvente</h1>
      <p className="text-gray-500 text-sm mb-10">Raspunsuri la cele mai comune intrebari</p>

      <div className="space-y-8">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-4">Nu ai gasit raspunsul? Contacteaza-ne!</p>
        <Link href="/contact" className="text-sm text-primary font-semibold hover:underline">
          Pagina de contact &rarr;
        </Link>
      </div>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.flatMap((section) =>
            section.items.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          ),
        }}
      />
    </div>
  );
}
