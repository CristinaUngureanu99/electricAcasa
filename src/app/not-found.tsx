import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden flex items-center justify-center">
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <div className="bg-white rounded-3xl p-10 md:p-14 text-center shadow-xl shadow-gray-200/50">
          {/* Logo */}
          <p className="text-xl font-bold text-primary/60 mb-8">electricAcasa.ro</p>

          {/* 404 number */}
          <p className="text-8xl md:text-9xl font-black text-gray-900 leading-none mb-4">
            404
          </p>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
            Pagina negasita
          </h1>
          <p className="text-gray-500 leading-relaxed mb-10">
            Pagina pe care o cauti nu exista sau a fost mutata.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-full text-sm hover:bg-gray-800 transition-colors"
            >
              Acasa
            </Link>
            <Link
              href="/catalog"
              className="bg-gray-100 px-8 py-3.5 text-gray-900 font-semibold rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              Vezi catalogul
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
