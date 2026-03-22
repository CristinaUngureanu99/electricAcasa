import Link from 'next/link';
import { site } from '@/config/site';

export const metadata = { title: 'Politica de cookies' };

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politica de cookies</h1>
      <p className="text-gray-500 text-sm mb-10">Ultima actualizare: martie 2026</p>

      <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ce sunt cookie-urile?</h2>
          <p>Cookie-urile sunt fisiere mici de text stocate in browserul tau atunci cand vizitezi un site web. Ele permit site-ului sa functioneze corect si sa iti ofere o experienta mai buna.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookie-uri utilizate pe {site.name}</h2>
          <p className="mb-3">Folosim exclusiv cookie-uri esentiale — nu folosim cookie-uri de marketing sau de urmarire (tracking).</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">Nume</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">Scop</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">Durata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs">sb-*</td>
                  <td className="px-4 py-2.5">Autentificare — sesiunea ta de utilizator (Supabase Auth)</td>
                  <td className="px-4 py-2.5">Sesiune / 1 an</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs">cookie-consent</td>
                  <td className="px-4 py-2.5">Retine ca ai acceptat utilizarea cookie-urilor</td>
                  <td className="px-4 py-2.5">Permanent (localStorage)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Date stocate local (localStorage)</h2>
          <p className="mb-3">Pe langa cookie-uri, folosim localStorage pentru a pastra anumite preferinte local in browserul tau:</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">Cheie</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-900">Scop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs">ea-cart</td>
                  <td className="px-4 py-2.5">Cosul de cumparaturi (pentru vizitatori neautentificati)</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs">cookie-consent</td>
                  <td className="px-4 py-2.5">Acceptul tau privind cookie-urile</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cum dezactivezi cookie-urile?</h2>
          <p>Poti sterge sau bloca cookie-urile din setarile browserului tau. Retine ca dezactivarea cookie-urilor esentiale poate afecta functionarea site-ului (autentificare, cos de cumparaturi).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
          <p>Pentru intrebari despre cookie-uri sau datele tale personale, contacteaza-ne la {site.contact.email}.</p>
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
