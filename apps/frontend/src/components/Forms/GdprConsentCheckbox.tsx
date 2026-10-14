import Link from 'next/link';

type Props = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Virheilmoituksen id. Kun annettu, ruutu merkitään virheelliseksi ja liitetään ilmoitukseen. */
  errorId?: string;
};

export default function GdprConsentCheckbox({ id = 'gdpr-consent', checked, onChange, errorId }: Props) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        name="gdpr_consent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-700"
      />
      <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400">
        Hyväksyn, että tietojani käsitellään tämän yhteydenoton/tarjouspyynnön käsittelyä varten{' '}
        <Link href="/tietosuoja" className="text-primary underline" target="_blank">
          tietosuojaselosteen
        </Link>{' '}
        mukaisesti. <span className="text-red-500">*</span>
      </label>
    </div>
  );
}
