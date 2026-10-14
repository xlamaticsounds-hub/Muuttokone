'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { useT } from '@/i18n/useT';
import { quoteFormDictionary } from '@/i18n/quoteFormDictionary';

// Sama lomake on käytössä kahdella sivulla:
// - 'business' (Yrityksille-sivu): yrityspalveluiden aiheet, yrityksen nimi pakollinen.
// - 'contact' (Yhteystiedot-sivu): kaikki sivuston palvelut, yritys valinnainen, koska
//   yhteystietosivua käyttävät myös yksityisasiakkaat.
type Variant = 'business' | 'contact';

// details kertoo, mitä kohdassa "Kohde ja aikataulu" kysytään: 'route' = mistä ja minne,
// 'single' = yksi osoite, 'phone' = ei kohdetta eikä aikataulua, koska asiasta sovitaan puhelimessa.
type Details = 'route' | 'single' | 'phone';
type Topic = { id: string; label: string; details: Details; placeholder?: string };
type TopicGroup = { label: string; topics: Topic[] };

// Yrityksille-sivun aiheet: samat palvelut kuin sivulla esitellään.
const BUSINESS_TOPIC_GROUPS: TopicGroup[] = [
  {
    label: 'Muutot',
    topics: [
      { id: 'toimistomuutto', label: 'Toimistomuutto', details: 'route' },
      { id: 'liiketilamuutto', label: 'Liiketilan tai myymälän muutto', details: 'route' },
      { id: 'sisaiset-siirrot', label: 'Sisäiset kalustesiirrot', details: 'single' },
    ],
  },
  {
    label: 'Muut palvelut',
    topics: [
      { id: 'poisvienti', label: 'Tavaroiden poisvienti ja kierrätys', details: 'single' },
      { id: 'tyhjennys', label: 'Kiinteistön tai varaston tyhjennys', details: 'single' },
      { id: 'tapahtumat', label: 'Tapahtumat ja messut', details: 'route' },
      { id: 'noudot', label: 'Noudot ja toimitukset', details: 'route' },
      {
        id: 'kausisiirrot',
        label: 'Kausisiirrot, kuten terassikalusteet',
        details: 'phone',
        placeholder: 'Esim. mitä siirretään ja mihin aikaan vuodesta',
      },
      {
        id: 'saannolliset',
        label: 'Säännölliset kuljetukset',
        details: 'phone',
        placeholder: 'Esim. mistä mihin ja kuinka usein',
      },
      {
        id: 'varastointi',
        label: 'Varastointi',
        details: 'phone',
        placeholder: 'Esim. tavaramäärä ja kuinka pitkäksi aikaa',
      },
    ],
  },
];

// Yhteystiedot-sivun aiheet: sivuston palvelut (sama lista kuin etusivun palveluosiossa).
const CONTACT_TOPIC_GROUPS: TopicGroup[] = [
  {
    label: 'Muutot',
    topics: [
      { id: 'kotimuutto', label: 'Kotimuutto', details: 'route' },
      { id: 'yritysmuutto', label: 'Yritysmuutto', details: 'route' },
    ],
  },
  {
    label: 'Muut palvelut',
    topics: [
      { id: 'pakkauspalvelu', label: 'Pakkauspalvelu', details: 'single' },
      { id: 'muuttosiivous', label: 'Muuttosiivous', details: 'single' },
      { id: 'kuolinpesa', label: 'Kuolinpesän tyhjennys', details: 'single' },
      { id: 'kuljetukset', label: 'Kuljetukset', details: 'route' },
      {
        id: 'muuttolaatikot',
        label: 'Muuttolaatikot',
        details: 'single',
        placeholder: 'Esim. montako laatikkoa ja kuinka pitkäksi aikaa',
      },
      { id: 'tyoapu', label: 'Työapu ja asennukset', details: 'single' },
    ],
  },
];

const OTHER_TOPIC: Topic = {
  id: 'muu',
  label: 'Muu',
  details: 'phone',
  placeholder: 'Esim. mitä pitää tehdä, missä ja milloin',
};

const VARIANTS: Record<
  Variant,
  { groups: TopicGroup[]; companyRequired: boolean; serviceType: string; source: string; sourceNote: string | null }
> = {
  business: { groups: BUSINESS_TOPIC_GROUPS, companyRequired: true, serviceType: 'yritysmuutto', source: 'yrityssivu', sourceNote: null },
  contact: {
    groups: CONTACT_TOPIC_GROUPS,
    companyRequired: false,
    serviceType: 'yhteydenotto',
    source: 'website',
    sourceNote: 'Yhteydenotto Yhteystiedot-sivun lomakkeelta',
  },
};

type FieldName = 'topic' | 'message' | 'companyName' | 'contactName' | 'phone' | 'email' | 'gdpr';
// Lomakkeen järjestyksessä: lähetettäessä siirrytään ensimmäiseen virheelliseen kenttään.
const FIELD_IDS: Record<FieldName, string> = {
  topic: 'topic',
  message: 'message',
  companyName: 'companyName',
  contactName: 'contactName',
  phone: 'phone',
  email: 'email',
  gdpr: 'gdpr-consent',
};
const FIELD_ORDER = Object.keys(FIELD_IDS) as FieldName[];

const labelClass = 'mb-2 block text-sm font-medium text-black dark:text-white';
const inputClass = (hasError = false) =>
  `w-full rounded-lg border px-4 py-3 focus:ring-2 focus:outline-hidden dark:bg-black dark:text-white ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
      : 'focus:ring-primary focus:border-primary border-gray-300 dark:border-gray-700'
  }`;
const cardClass =
  'rounded-2xl border border-black/5 bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5';

function Required() {
  return (
    <span aria-hidden="true" className="text-red-500">
      *
    </span>
  );
}

function FieldError({ id, message, className = '' }: { id: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={`mt-1.5 text-sm text-red-600 dark:text-red-400 ${className}`}>
      {message}
    </p>
  );
}

function StepHeading({ id, step, title }: { id: string; step: number; title: string }) {
  return (
    <h3 id={id} className="flex items-center gap-3 text-lg font-semibold text-black/90 dark:text-white">
      <span
        aria-hidden="true"
        className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      >
        {step}
      </span>
      {title}
    </h3>
  );
}

type Props = {
  variant?: Variant;
  /** Kortin leveys sivun asettelussa. Oletuksena keskitetty, enintään max-w-2xl. */
  className?: string;
};

export default function BusinessQuoteForm({ variant = 'business', className = 'mx-auto max-w-2xl' }: Props) {
  const t = useT(quoteFormDictionary);
  const siteConfig = useSiteConfig();
  const config = VARIANTS[variant];
  const allTopics = [...config.groups.flatMap((group) => group.topics), OTHER_TOPIC];

  const [data, setData] = useState({
    topic: '',
    message: '',
    fromAddress: '',
    toAddress: '',
    movingDate: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topic = allTopics.find((item) => item.id === data.topic);
  const isOther = data.topic === OTHER_TOPIC.id;
  // Kohde ja aikataulu kysytään vain aiheissa, joissa ne ovat olennaisia. Ennen aiheen valintaa ja
  // puhelimessa sovittavissa asioissa lomakkeella on vain kuvaus ja yhteystiedot.
  const details: Details = topic?.details ?? 'phone';
  const showDetails = details !== 'phone';
  const isPhoneTopic = !!topic && details === 'phone';

  const clearError = (field: FieldName) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (name in FIELD_IDS) clearError(name as FieldName);
    // Kuvaus on pakollinen vain Muu-valinnalla, joten sen virhe poistuu kun aihe vaihtuu.
    if (name === 'topic') clearError('message');
  };

  const validate = () => {
    const found: Partial<Record<FieldName, string>> = {};
    if (!topic) found.topic = t('Valitse, mitä asia koskee.');
    if (isOther && !data.message.trim()) found.message = t('Kertokaa lyhyesti, mitä tarvitsette.');
    if (config.companyRequired && !data.companyName.trim()) found.companyName = t('Kirjoita yrityksen nimi.');
    if (!data.contactName.trim()) {
      found.contactName = config.companyRequired ? t('Kirjoita yhteyshenkilön nimi.') : t('Kirjoita nimesi.');
    }
    if (!data.phone.trim()) found.phone = t('Kirjoita puhelinnumero.');
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      found.email = t('Tarkista sähköpostiosoite.');
    }
    if (!gdprConsent) found.gdpr = t('Hyväksy tietojen käsittely, jotta voimme vastata yhteydenottoonne.');
    return found;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      const el = document.getElementById(FIELD_IDS[firstInvalid]);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
      return;
    }

    // Aihe kulkee viestin alussa suomeksi, jotta se näkyy liidin muistiinpanoissa hallintapaneelissa ja
    // Discord-ilmoituksessa: liidillä ei ole omaa kenttää palvelun tyypille.
    const header = [config.sourceNote, topic && `Aihe: ${topic.label}`].filter(Boolean).join('\n');
    const message = [header, data.message.trim()].filter(Boolean).join('\n\n');

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: data.contactName.trim(),
            company_name: data.companyName.trim() || null,
            phone: data.phone.trim(),
            email: data.email.trim() || null,
            // Piilotettujen kenttien arvot jätetään pois, jos aihetta on vaihdettu täyttämisen jälkeen.
            from_location: showDetails ? data.fromAddress.trim() || null : null,
            to_location: details === 'route' ? data.toAddress.trim() || null : null,
            moving_date: showDetails ? data.movingDate || null : null,
            message,
            service_type: config.serviceType,
            source: config.source,
            gdpr_consent: gdprConsent,
            company: honeypot,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('Kiitos! Olemme sinuun yhteydessä pian.'));
        setSubmitted(true);
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Quote form submission error:', error);
      toast.error(t('Jotain meni pieleen. Yritä uudelleen tai soita meille.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Virheellisen kentän saavutettavuusmerkinnät: ruudunlukija lukee virheilmoituksen kentän yhteydessä.
  const errorProps = (field: FieldName) =>
    errors[field]
      ? { 'aria-invalid': true as const, 'aria-describedby': `${FIELD_IDS[field]}-error` }
      : {};

  if (submitted) {
    const thanks = isPhoneTopic
      ? t('Soitamme teille mahdollisimman pian ja käymme tarpeenne läpi.')
      : variant === 'business'
        ? t('Olemme sinuun yhteydessä mahdollisimman pian ja sovitaan maksuttomasta kartoituksesta.')
        : t('Olemme sinuun yhteydessä mahdollisimman pian.');
    return (
      <div className={`${cardClass} p-8 text-center ${className}`}>
        <h3 className="mb-2 text-xl font-bold text-black/90 dark:text-white">{t('Kiitos yhteydenotosta!')}</h3>
        <p className="text-black/70 dark:text-white/70">
          {thanks} {t('Kiireellisessä asiassa voit myös soittaa suoraan:')}{' '}
          <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-primary hover:underline">
            {siteConfig?.contact?.phone?.display}
          </Link>
          .
        </p>
      </div>
    );
  }

  const companyField = (
    <div>
      <label htmlFor="companyName" className={labelClass}>
        {config.companyRequired ? (
          <>
            {t('Yrityksen nimi')} <Required />
          </>
        ) : (
          t('Yritys (valinnainen)')
        )}
      </label>
      <input
        type="text"
        id="companyName"
        name="companyName"
        autoComplete="organization"
        value={data.companyName}
        onChange={handleChange}
        required={config.companyRequired}
        placeholder={t('Yritys Oy')}
        className={inputClass(!!errors.companyName)}
        {...errorProps('companyName')}
      />
      <FieldError id="companyName" message={errors.companyName} />
    </div>
  );
  const nameField = (
    <div>
      <label htmlFor="contactName" className={labelClass}>
        {config.companyRequired ? t('Yhteyshenkilö') : t('Nimi')} <Required />
      </label>
      <input
        type="text"
        id="contactName"
        name="contactName"
        autoComplete="name"
        value={data.contactName}
        onChange={handleChange}
        required
        placeholder={t('Etunimi Sukunimi')}
        className={inputClass(!!errors.contactName)}
        {...errorProps('contactName')}
      />
      <FieldError id="contactName" message={errors.contactName} />
    </div>
  );
  const phoneField = (
    <div>
      <label htmlFor="phone" className={labelClass}>
        {t('Puhelin')} <Required />
      </label>
      <input
        type="tel"
        id="phone"
        name="phone"
        autoComplete="tel"
        value={data.phone}
        onChange={handleChange}
        required
        placeholder="040 123 4567"
        className={inputClass(!!errors.phone)}
        {...errorProps('phone')}
      />
      <FieldError id="phone" message={errors.phone} />
    </div>
  );
  const emailField = (
    <div>
      <label htmlFor="email" className={labelClass}>
        {t('Sähköposti')}
      </label>
      <input
        type="email"
        id="email"
        name="email"
        autoComplete="email"
        value={data.email}
        onChange={handleChange}
        placeholder={variant === 'business' ? t('posti@yritys.fi') : t('posti@esimerkki.fi')}
        className={inputClass(!!errors.email)}
        {...errorProps('email')}
      />
      <FieldError id="email" message={errors.email} />
    </div>
  );

  return (
    <div className={`${cardClass} p-7 md:p-10 ${className}`}>
      <form onSubmit={handleSubmit} noValidate className="@container space-y-8" autoComplete="on">
        <p className="text-sm text-black/60 dark:text-white/60">
          {t('Pakolliset kentät on merkitty tähdellä')} <span className="text-red-500">*</span>
        </p>

        {/* 1. Mitä tarvitsette? */}
        <div role="group" aria-labelledby="business-step-1" className="space-y-5">
          <StepHeading id="business-step-1" step={1} title={t('Mitä tarvitsette?')} />
          <div>
            <label htmlFor="topic" className={labelClass}>
              {t('Mitä asia koskee?')} <Required />
            </label>
            <select
              id="topic"
              name="topic"
              value={data.topic}
              onChange={handleChange}
              required
              className={inputClass(!!errors.topic)}
              {...errorProps('topic')}
            >
              <option value="">{t('Valitse aihe')}</option>
              {config.groups.map((group) => (
                <optgroup key={group.label} label={t(group.label)}>
                  {group.topics.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.label)}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={OTHER_TOPIC.id}>{t(OTHER_TOPIC.label)}</option>
            </select>
            <FieldError id="topic" message={errors.topic} />
            <div aria-live="polite">
              {isPhoneTopic && !isOther && (
                <p className="bg-primary/5 mt-3 flex items-start gap-2 rounded-lg px-4 py-3 text-sm text-black/80 dark:bg-white/5 dark:text-white/80">
                  <Phone aria-hidden="true" className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  {t('Jättäkää yhteystietonne, niin otamme teihin yhteyttä ja käymme tarpeenne läpi.')}
                </p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="message" className={labelClass}>
              {isOther ? (
                <>
                  {t('Kertokaa lyhyesti, mitä tarvitsette')} <Required />
                </>
              ) : (
                t('Kertokaa lyhyesti tarpeestanne')
              )}
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={data.message}
              onChange={handleChange}
              required={isOther}
              placeholder={t(topic?.placeholder ?? 'Esim. tavaramäärä, erikoiskuljetukset tai toiveet aikataulusta')}
              className={`${inputClass(!!errors.message)} resize-none`}
              {...errorProps('message')}
            />
            <FieldError id="message" message={errors.message} />
          </div>
        </div>

        {/* 2. Kohde ja aikataulu: vain aiheissa, joissa ne ovat olennaisia */}
        {showDetails && (
          <div
            role="group"
            aria-labelledby="business-step-2"
            className="space-y-5 border-t border-black/5 pt-8 dark:border-white/10"
          >
            <StepHeading id="business-step-2" step={2} title={t('Kohde ja aikataulu')} />
            <div className="grid grid-cols-1 gap-5 @lg:grid-cols-2">
              {details === 'route' ? (
                <>
                  <div>
                    <label htmlFor="fromAddress" className={labelClass}>
                      {t('Mistä')}
                    </label>
                    <input
                      type="text"
                      id="fromAddress"
                      name="fromAddress"
                      value={data.fromAddress}
                      onChange={handleChange}
                      placeholder={t('Lähtöosoite')}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="toAddress" className={labelClass}>
                      {t('Minne')}
                    </label>
                    <input
                      type="text"
                      id="toAddress"
                      name="toAddress"
                      value={data.toAddress}
                      onChange={handleChange}
                      placeholder={t('Kohdeosoite')}
                      className={inputClass()}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="fromAddress" className={labelClass}>
                    {t('Osoite')}
                  </label>
                  <input
                    type="text"
                    id="fromAddress"
                    name="fromAddress"
                    value={data.fromAddress}
                    onChange={handleChange}
                    placeholder={t('Kohteen osoite')}
                    className={inputClass()}
                  />
                </div>
              )}
              <div>
                <label htmlFor="movingDate" className={labelClass}>
                  {t('Toivottu ajankohta')}
                </label>
                <input
                  type="date"
                  id="movingDate"
                  name="movingDate"
                  value={data.movingDate}
                  onChange={handleChange}
                  aria-describedby="movingDate-hint"
                  className={inputClass()}
                />
                <p id="movingDate-hint" className="mt-1.5 text-xs text-black/60 dark:text-white/60">
                  {t('Voit jättää tyhjäksi, jos päivä ei ole vielä tiedossa.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Yhteystiedot. Yrityssivulla yritys ensin, yhteystietosivulla oma nimi ensin. */}
        <div
          role="group"
          aria-labelledby="business-step-3"
          className="space-y-5 border-t border-black/5 pt-8 dark:border-white/10"
        >
          <StepHeading id="business-step-3" step={showDetails ? 3 : 2} title={t('Yhteystiedot')} />
          <div className="grid grid-cols-1 gap-5 @lg:grid-cols-2">
            {config.companyRequired ? (
              <>
                {companyField}
                {nameField}
                {phoneField}
                {emailField}
              </>
            ) : (
              <>
                {nameField}
                {phoneField}
                {emailField}
                {companyField}
              </>
            )}
          </div>
        </div>

        <div className="space-y-5 border-t border-black/5 pt-8 dark:border-white/10">
          <Honeypot value={honeypot} onChange={setHoneypot} />
          <div>
            <GdprConsentCheckbox
              checked={gdprConsent}
              onChange={(checked) => {
                setGdprConsent(checked);
                if (checked) clearError('gdpr');
              }}
              errorId={errors.gdpr ? 'gdpr-consent-error' : undefined}
            />
            <FieldError id="gdpr-consent" message={errors.gdpr} className="pl-7" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-secondary w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? t('Lähetetään...')
              : isPhoneTopic
                ? t('Lähetä yhteydenottopyyntö')
                : t('Lähetä tarjouspyyntö')}
          </button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t('Tai soita suoraan:')}{' '}
            <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-black hover:text-primary dark:text-white">
              {siteConfig?.contact?.phone?.display}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
