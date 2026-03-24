'use client';

import { RotateCcw } from 'lucide-react';

interface Props {
  onReset: () => void;
  visible: boolean;
}

export function FilterReset({ onReset, visible }: Props) {
  if (!visible) return null;
  return (
    <button
      onClick={onReset}
      className="flex items-center gap-1.5 text-xs text-danger hover:text-red-700 px-2 py-1.5 rounded-xl hover:bg-danger/10 transition-colors"
    >
      <RotateCcw size={12} /> Reseteaza filtrele
    </button>
  );
}
