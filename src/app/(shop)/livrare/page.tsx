import Link from 'next/link';
import { site } from '@/config/site';
import { Truck, Package, Clock, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Informatii livrare',
  description:
    'Informatii despre livrare, costuri de transport si transport gratuit pe electricAcasa.ro.',
};

export default function LivrarePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Informatii livrare</h1>
      <p className="text-gray-500 text-sm mb-10">Totul despre livrarea comenzilor tale</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5">
          <Truck size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Curier la adresa</p>
            <p className="text-sm text-gray-500 mt-1">
              {site.shipping.fixedCost} RON — gratuit pentru comenzi peste{' '}
              {site.shipping.freeThreshold} RON
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5">
          <Package size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">EasyBox</p>
            <p className="text-sm text-gray-500 mt-1">
              {site.shipping.easyboxCost} RON — ridici coletul dintr-un locker, gratuit peste{' '}
              {site.shipping.freeThreshold} RON
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5">
          <Clock size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Termen livrare</p>
            <p className="text-sm text-gray-500 mt-1">1-3 zile lucratoare dupa procesare</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5">
          <Package size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Procesare comanda</p>
            <p className="text-sm text-gray-500 mt-1">1-2 zile lucratoare de la plasare</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5">
          <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Zona acoperire</p>
            <p className="text-sm text-gray-500 mt-1">Toata Romania, prin curier</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cum urmaresc comanda?</h2>
          <p>
            Dupa plasarea comenzii, poti urmari statusul din sectiunea{' '}
            <Link href="/comenzi" className="text-primary hover:underline">
              Comenzile mele
            </Link>{' '}
            din contul tau. Vei fi notificat pe email la fiecare schimbare de status.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Ce fac daca coletul ajunge deteriorat?
          </h2>
          <p>
            Daca produsele primite sunt deteriorate sau diferite de cele comandate, contacteaza-ne
            in termen de 48 de ore la {site.contact.email}. Costul de retur va fi suportat de noi.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Retur</h2>
          <p>
            Ai dreptul de retur in 14 zile calendaristice. Detalii complete pe pagina{' '}
            <Link href="/politica-retur" className="text-primary hover:underline">
              Politica de retur
            </Link>
            .
          </p>
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
