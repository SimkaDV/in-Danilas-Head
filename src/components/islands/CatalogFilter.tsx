import { useEffect, useRef, useState } from 'react';
import './CaseTabs.css';

interface Filter {
  id: string;
  label: string;
}

interface Props {
  label: string;
  filters: Filter[];
}

const ALL = 'all';

// прячет карточки с data-catalog-category внутри секции [data-catalog]
export default function CatalogFilter({ label, filters }: Props) {
  const [active, setActive] = useState(filters[0]?.id ?? ALL);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current?.closest('[data-catalog]');
    section?.querySelectorAll<HTMLElement>('[data-catalog-category]').forEach((el) => {
      el.hidden = active !== ALL && el.dataset.catalogCategory !== active;
    });
  }, [active]);

  return (
    <div className="case-tabs" ref={root} role="group" aria-label={label}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className="case-tabs__pill"
          aria-pressed={filter.id === active}
          onClick={() => setActive(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
