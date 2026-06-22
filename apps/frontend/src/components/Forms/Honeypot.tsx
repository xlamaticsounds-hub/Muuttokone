type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Spam trap: real users never see or fill this field. Bots that auto-fill every
// input often fill it, so we use that as a signal to silently drop the submission.
// Field name "company" intentionally looks legitimate to scripted form-fillers.
export default function Honeypot({ value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] top-0 h-px w-px overflow-hidden"
    >
      <label htmlFor="company">Yritys</label>
      <input
        type="text"
        id="company"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
