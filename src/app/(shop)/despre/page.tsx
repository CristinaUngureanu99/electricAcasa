import Link from 'next/link';
import { site } from '@/config/site';
import { Zap, Users, Truck, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Despre noi',
  description:
    'Cine suntem si de ce sa alegi electricAcasa — materiale electrice de calitate, livrate rapid in toata tara.',
};

export default function DesprePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Despre {site.name}</h1>
      <p className="text-gray-500 text-sm mb-10">Cine suntem si ce facem</p>

      <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
        <p>
          {site.name} este un magazin online specializat in comercializarea de materiale electrice
          de calitate: aparataj, iluminat, protectii electrice, cabluri, smart home, statii de
          incarcare EV si sisteme HVAC.
        </p>

        <p>
          Misiunea noastra este sa oferim produse electrice de incredere, la preturi corecte, cu
          livrare rapida in toata Romania. Fie ca esti electrician, constructor sau renovezi propria
          locuinta, gasesti la noi tot ce ai nevoie pentru un proiect electric complet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
            <Zap size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Produse de calitate</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Branduri de incredere, cu specificatii complete si fise tehnice
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
            <Users size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Consultanta personalizata</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Generator de pachete pentru proiectul tau, cu oferta pe masura
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
            <Truck size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Livrare nationala</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Transport rapid, gratuit pentru comenzi peste {site.shipping.freeThreshold} RON
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
            <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Plata sigura</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Plata ramburs sau cu cardul, in deplina siguranta
              </p>
            </div>
          </div>
        </div>

        <p>
          Daca ai intrebari sau ai nevoie de ajutor cu o comanda, nu ezita sa ne contactezi la{' '}
          <a href={`mailto:${site.contact.email}`} className="text-primary hover:underline">
            {site.contact.email}
          </a>{' '}
          sau la{' '}
          <a href={`tel:${site.contact.phone}`} className="text-primary hover:underline">
            {site.contact.phone}
          </a>
          .
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link href="/" className="text-gray-900 font-semibold hover:underline">
          &larr; Inapoi la magazin
        </Link>
      </div>
    </div>
  );
}
