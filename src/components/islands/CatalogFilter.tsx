import { useEffect, useRef, useState } from 'react';
import { waveFilter } from '@/scripts/catalog-wave';
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
  const firstRun = useRef(true);

  useEffect(() => {
    // при загрузке видны все, волну первого появления запускает Catalog.astro
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const section = root.current?.closest('[data-catalog]');
    if (section) waveFilter(section, (el) => active === ALL || el.dataset.catalogCategory === active);
  }, [active]);

  return (
    <div className="case-tabs" ref={root} role="group" aria-label={label}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className="case-tabs__pill"
          data-scroll-lift
          aria-pressed={filter.id === active}
          onClick={() => setActive(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
