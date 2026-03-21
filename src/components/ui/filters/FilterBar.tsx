interface Props {
  children: React.ReactNode;
}

export function FilterBar({ children }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {children}
    </div>
  );
}
