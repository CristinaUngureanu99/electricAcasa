'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  allLabel?: string;
}

export function FilterPills({ value, onChange, options, allLabel = 'Toate' }: Props) {
  const all = [{ value: 'all', label: allLabel }, ...options];
  return (
    <div className="flex gap-1.5 flex-wrap">
      {all.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-xl transition-colors ${
            value === opt.value
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
