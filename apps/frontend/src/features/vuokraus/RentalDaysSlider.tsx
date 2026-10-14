'use client';

// Vuokra-ajan liukusäädin päivän tarkkuudella. Käytössä Muuttolaatikot-sivun tilauslomakkeessa,
// muuttolaskurin laatikkokortissa ja laskurin laatikkoikkunassa, jotta valinta toimii kaikkialla samoin.

type Props = {
  id: string;
  label: string;
  /** Yksikkö arvon perään, esim. "vrk". */
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (days: number) => void;
};

export default function RentalDaysSlider({ id, label, unit, value, min, max, onChange }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const current = clamp(value || min);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-xs font-bold uppercase text-gray-400">
          {label}
        </label>
        <span className="text-primary text-lg font-bold">
          {current} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-valuetext={`${current} ${unit}`}
        className="accent-primary w-full"
      />
      <div className="mt-1 flex justify-between text-xs text-gray-400" aria-hidden="true">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
