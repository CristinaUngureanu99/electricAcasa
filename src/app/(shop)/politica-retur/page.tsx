import Link from 'next/link';
import { site } from '@/config/site';

export const metadata = { title: 'Politica de retur' };

export default function PoliticaReturPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politica de retur</h1>
      <p className="text-gray-500 text-sm mb-10">Ultima actualizare: martie 2026</p>

      <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Dreptul de retragere</h2>
          <p>Conform OUG 34/2014, ai dreptul de a te retrage din contractul de vanzare in termen de <strong>14 zile calendaristice</strong> de la data primirii produsului, fara a fi nevoit sa justifici decizia si fara penalitati.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Conditii de retur</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Produsul trebuie sa fie in starea originala, nefolosit, cu etichetele intacte</li>
            <li>Ambalajul original trebuie sa fie intact si nedeteriorat</li>
            <li>Produsul trebuie insotit de factura sau dovada achizitiei</li>
            <li>Produsele personalizate sau taiate la comanda nu pot fi returnate</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Procedura de retur</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Contacteaza-ne la {site.contact.email} cu numarul comenzii si motivul returului</li>
            <li>Vei primi confirmarea si instructiunile de expediere</li>
            <li>Trimite produsul la adresa indicata, in termen de 14 zile de la notificare</li>
            <li>Costul de expeditie pentru retur este suportat de cumparator</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Rambursarea</h2>
          <p>Rambursarea se efectueaza in termen de maximum 14 zile de la primirea produsului returnat, folosind aceeasi metoda de plata utilizata la achizitie. In cazul platii ramburs, rambursarea se face prin transfer bancar.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Produse defecte sau gresite</h2>
          <p>Daca ai primit un produs defect sau diferit de cel comandat, contacteaza-ne in termen de 48 de ore de la primire. Costul de retur va fi suportat de {site.name} si vei primi un produs nou sau rambursarea integrala.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Solutionarea alternativa a litigiilor</h2>
          <p>In cazul unui litigiu legat de un retur, poti apela la solutionarea alternativa a litigiilor (SAL) prin intermediul ANPC. Mai multe informatii: <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">anpc.ro/ce-este-sal</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contact</h2>
          <p>{site.contact.email} | {site.contact.phone}</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link href="/" className="text-gray-900 font-semibold hover:underline">
          &larr; Inapoi la magazin
        </Link>
      </div>
    </div>
  );
}
