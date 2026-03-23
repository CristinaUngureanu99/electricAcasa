import Link from 'next/link';
import { site } from '@/config/site';

export const metadata = {
  title: 'Termeni si conditii',
  description: 'Termenii si conditiile de utilizare a magazinului online electricAcasa.ro.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termeni si conditii</h1>
        <p className="text-gray-500 text-sm mb-10">Ultima actualizare: martie 2026</p>

        <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Informatii generale</h2>
            <p>
              Prezentele Termeni si conditii reglementeaza utilizarea site-ului {site.url} (denumit
              in continuare &quot;Site-ul&quot;) si achizitionarea produselor oferite de {site.name}{' '}
              (denumit in continuare &quot;Vanzatorul&quot;).
            </p>
            <p className="mt-2">
              Contact: {site.contact.email} | {site.contact.phone}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Produse si preturi</h2>
            <p>
              Preturile afisate pe Site includ TVA si sunt exprimate in RON. Vanzatorul isi rezerva
              dreptul de a modifica preturile in orice moment, fara notificare prealabila. Pretul
              aplicabil este cel afisat la momentul plasarii comenzii.
            </p>
            <p className="mt-2">
              Fotografiile produselor au caracter informativ. Specificatiile tehnice din fisele de
              produs sunt cele furnizate de producatori.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Comenzi</h2>
            <p>
              Prin plasarea unei comenzi pe Site, cumparatorul declara ca are cel putin 18 ani si ca
              datele furnizate sunt corecte si complete.
            </p>
            <p className="mt-2">
              Confirmarea comenzii se face prin email. Vanzatorul isi rezerva dreptul de a refuza o
              comanda in cazuri justificate (stoc insuficient, date incorecte, suspiciune de
              frauda).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Plata</h2>
            <p>
              Metodele de plata acceptate sunt: card bancar (prin Stripe) si ramburs (plata la
              livrare). Plata cu card se proceseaza securizat prin intermediul Stripe. Vanzatorul nu
              stocheaza datele cardului.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Livrare</h2>
            <p>
              Livrarea se face pe teritoriul Romaniei. Costul de transport este de{' '}
              {site.shipping.fixedCost} RON, gratuit pentru comenzi peste{' '}
              {site.shipping.freeThreshold} RON. Termenul estimativ de livrare este de 2-5 zile
              lucratoare.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Dreptul de retragere</h2>
            <p>
              Conform OUG 34/2014, cumparatorul are dreptul de a se retrage din contract in termen
              de 14 zile calendaristice de la primirea produsului, fara a fi nevoit sa justifice
              decizia. Detalii in{' '}
              <Link href="/politica-retur" className="text-primary hover:underline">
                Politica de retur
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Garantie</h2>
            <p>
              Produsele beneficiaza de garantia oferita de producator, conform legislatiei in
              vigoare. Perioada de garantie este specificata in fisa tehnica a fiecarui produs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Raspundere</h2>
            <p>
              Vanzatorul nu raspunde pentru daunele rezultate din utilizarea necorespunzatoare a
              produselor sau din nerespectarea instructiunilor de instalare. Instalatiile electrice
              trebuie realizate de personal calificat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              9. Solutionarea alternativa a litigiilor
            </h2>
            <p>
              In cazul unui litigiu, consumatorii pot apela la procedura de solutionare alternativa
              a litigiilor (SAL) prin intermediul ANPC. Mai multe informatii:{' '}
              <a
                href="https://anpc.ro/ce-este-sal/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                anpc.ro/ce-este-sal
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Legea aplicabila</h2>
            <p>
              Prezentele Termeni si conditii sunt guvernate de legislatia din Romania. Orice litigiu
              va fi solutionat de instantele competente din Romania.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/" className="text-gray-900 font-semibold hover:underline">
            &larr; Inapoi la magazin
          </Link>
        </div>
      </div>
    </div>
  );
}
