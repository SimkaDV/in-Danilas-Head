import { useEffect, useRef, useState } from 'react';
import './CaseTabs.css';

interface Variant {
  id: string;
  label: string;
}

interface Props {
  label: string;
  variants: Variant[];
}

// переключает картинки с data-case-variant внутри секции [data-flagship]
export default function CaseTabs({ label, variants }: Props) {
  const [active, setActive] = useState(variants[0]?.id);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current?.closest('[data-flagship]');
    section?.querySelectorAll<HTMLElement>('[data-case-variant]').forEach((el) => {
      el.hidden = el.dataset.caseVariant !== active;
    });
  }, [active]);

  return (
    <div className="case-tabs" ref={root} role="group" aria-label={label}>
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          className="case-tabs__pill"
          aria-pressed={variant.id === active}
          onClick={() => setActive(variant.id)}
        >
          {variant.label}
        </button>
      ))}
    </div>
  );
}
