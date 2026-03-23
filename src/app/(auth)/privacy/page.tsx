import Link from 'next/link';
import { site } from '@/config/site';

export const metadata = {
  title: 'Politica de confidentialitate',
  description: 'Cum colectam, folosim si protejam datele tale personale pe electricAcasa.ro.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politica de confidentialitate</h1>
        <p className="text-gray-500 text-sm mb-10">Ultima actualizare: martie 2026</p>

        <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Date pe care le colectam
            </h2>
            <p>
              Colectam urmatoarele date personale: nume, adresa de email, numar de telefon, adresa
              de livrare si facturare. Aceste date sunt necesare pentru procesarea comenzilor si
              livrarea produselor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. Baza legala a prelucrarii
            </h2>
            <p>Prelucram datele tale personale pe urmatoarele baze legale:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>
                <strong>Executarea contractului</strong> (art. 6 alin. 1 lit. b GDPR) — pentru
                procesarea comenzilor, livrare si facturare
              </li>
              <li>
                <strong>Obligatie legala</strong> (art. 6 alin. 1 lit. c GDPR) — pentru conformarea
                cu legislatia fiscala si protectia consumatorului
              </li>
              <li>
                <strong>Consimtamant</strong> (art. 6 alin. 1 lit. a GDPR) — pentru comunicari
                comerciale (newsletter)
              </li>
              <li>
                <strong>Interes legitim</strong> (art. 6 alin. 1 lit. f GDPR) — pentru imbunatatirea
                serviciilor si prevenirea fraudei
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Cum folosim datele</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Procesarea si livrarea comenzilor</li>
              <li>Comunicarea cu privire la status comenzi</li>
              <li>Imbunatatirea serviciilor noastre</li>
              <li>Trimiterea de comunicari comerciale (doar cu consimtamant explicit)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              5. Stocarea si perioada de pastrare
            </h2>
            <p>
              Datele sunt stocate in sisteme securizate (Supabase, cu servere in UE). Parolele sunt
              criptate si nu sunt accesibile personalului. Datele de plata cu card sunt procesate de
              Stripe si nu sunt stocate pe serverele noastre.
            </p>
            <p className="mt-2">
              <strong>Perioada de pastrare:</strong> Datele contului sunt pastrate cat timp contul
              este activ. Datele comenzilor sunt pastrate conform obligatiilor fiscale (minim 5
              ani). La stergerea contului, datele personale sunt eliminate, cu exceptia celor
              necesare din punct de vedere legal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Partajarea datelor</h2>
            <p>Datele personale nu sunt vandute catre terti. Le partajam doar cu:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Stripe — procesare plati card</li>
              <li>Servicii de curierat — livrarea comenzilor</li>
              <li>Autoritati — la cerere legala</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Drepturile tale</h2>
            <p>Conform GDPR, ai dreptul la:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Acces la datele tale personale</li>
              <li>Rectificarea datelor incorecte</li>
              <li>Stergerea datelor (&quot;dreptul de a fi uitat&quot;)</li>
              <li>Restrictionarea prelucrarii</li>
              <li>Portabilitatea datelor</li>
              <li>Opozitia la prelucrare</li>
              <li>Retragerea consimtamantului (pentru comunicari comerciale)</li>
            </ul>
            <p className="mt-2">
              Pentru exercitarea acestor drepturi, contacteaza-ne la {site.contact.email}.
            </p>
            <p className="mt-2">
              <strong>Dreptul de plangere:</strong> Ai dreptul de a depune o plangere la Autoritatea
              Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal (ANSPDCP) —{' '}
              <a
                href="https://www.dataprotection.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                dataprotection.ro
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Furnizarea datelor</h2>
            <p>
              Furnizarea numelui, emailului si adresei de livrare este o cerinta contractuala
              necesara pentru procesarea comenzii. Fara aceste date, nu putem finaliza comanda.
              Furnizarea numarului de telefon este optionala dar recomandata pentru livrare.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Cookie-uri</h2>
            <p>
              Site-ul foloseste cookie-uri necesare pentru functionarea corecta (autentificare,
              sesiune). Nu folosim cookie-uri de tracking sau publicitate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>
              Pentru intrebari despre protectia datelor: {site.contact.email} | {site.contact.phone}
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
