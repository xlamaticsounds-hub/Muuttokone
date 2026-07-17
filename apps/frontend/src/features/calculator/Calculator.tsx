'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateMovingPrice, CalculatorData, PriceBreakdown, FURNITURE_CATALOG, INCLUDED_DISTANCE_KM, RECYCLING_WASTE_TYPES } from './pricing';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, ArrowLeft, Calculator as CalcIcon, Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';

const DIFFICULTY_BADGES: Record<PriceBreakdown['difficultyLevel'], { emoji: string; label: string }> = {
  easy: { emoji: '🟢', label: 'Helppo muutto' },
  medium: { emoji: '🟡', label: 'Keskivaikea muutto' },
  hard: { emoji: '🔴', label: 'Vaativa muutto' },
};

const CARRY_DISTANCE_OPTIONS: { value: CalculatorData['carryDistanceFrom']; label: string }[] = [
  { value: '<10', label: 'Alle 10 m' },
  { value: '10-30', label: '10–30 m' },
  { value: '30-50', label: '30–50 m' },
  { value: '50+', label: 'Yli 50 m' },
];

// One entry per real step of the "moving" flow (service -> package -> locations ->
// details -> inventory -> quote -> booking). The "package" step (idx 1) doesn't apply
// to transport/recycling, so it's the one skipped via the idx === 1 check below — every
// other label lines up 1:1 with the step content for both flows.
const STEPS = [
  { id: 'service', title: 'Palvelu' },
  { id: 'package', title: 'Paketti' },
  { id: 'locations', title: 'Sijainti' },
  { id: 'details', title: 'Asunnon tiedot' },
  { id: 'inventory', title: 'Tavarat' },
  { id: 'quote', title: 'Hinta-arvio' },
  { id: 'booking', title: 'Varaus' },
];

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(0);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const isFirstStepRender = useRef(true);
  const [formData, setFormData] = useState<CalculatorData>({
    serviceType: 'moving',
    movingPackage: 'full_service',
    addressFrom: '',
    addressTo: '',
    additionalStops: [],
    distanceKm: 5,
    driverCount: '1',
    apartmentSize: '1h',
    floorFrom: 0,
    elevatorFrom: true,
    floorTo: 0,
    elevatorTo: true,
    carryDistanceFrom: '<10',
    carryDistanceTo: '<10',
    boxCount: 0,
    heavyItems: [],
    furnitureItems: {},
    customItems: [],
    needsPacking: false,
    needsCleaning: false,
    services: [],
    selectedWasteTypes: [],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Autocomplete Refs
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const scriptLoaded = useRef(false);
  const savedScrollY = useRef(0);
  const autocompleteServiceRef = useRef<any>(null);
  const [fromPredictions, setFromPredictions] = useState<{description: string; place_id: string}[]>([]);
  const [toPredictions, setToPredictions] = useState<{description: string; place_id: string}[]>([]);

  const priceResult = useMemo(() => calculateMovingPrice(formData), [formData]);

  // Step content height varies a lot (e.g. inventory step vs. quote step). Without this,
  // the browser keeps the same absolute scroll position when switching steps, which can
  // suddenly land the viewport near the bottom of a much shorter step ("page jumps down").
  // Re-anchoring to the top of the calculator card on every step change keeps it in place.
  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  // Helper function to get inventory step label based on service type
  const getInventoryLabel = () => {
    if (formData.serviceType === 'recycling') return 'Poistettavat tavarat';
    if (formData.serviceType === 'transport') return 'Kuljetettavat tavarat';
    return 'Muutettava tavara';
  };

  // Hinta-arvioon aina sisältyvät hyödyt (ei lisäpalveluita) — vaihtelee palvelupaketin mukaan
  const getIncludedServices = () => {
    if (formData.serviceType === 'transport') {
      return [
        `${formData.driverCount} kuljettaja${formData.driverCount === '2' ? 'a' : ''} + pakettiauto`,
        'Kuljetusvakuutus',
        `Ensimmäiset ${INCLUDED_DISTANCE_KM} km sisältyvät hintaan`,
        'ALV sisältyy hintaan',
      ];
    }
    if (formData.movingPackage === 'driver_with_vehicle') {
      return ['Kuljettaja + kuorma-auto', 'Muuttovakuutus', `Ensimmäiset ${INCLUDED_DISTANCE_KM} km sisältyvät hintaan`, 'ALV sisältyy hintaan'];
    }
    if (formData.movingPackage === 'carrying_help') {
      return ['2 kantajaa', 'Muuttovakuutus', 'ALV sisältyy hintaan'];
    }
    return [
      '2 muuttajaa',
      'Muuttoauto',
      'Muuttovakuutus',
      'Suojamateriaalit',
      `Ensimmäiset ${INCLUDED_DISTANCE_KM} km sisältyvät hintaan`,
      'ALV sisältyy hintaan',
    ];
  };

  const formatDateInput = (date?: Date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

  const selectedInventoryItems = Object.entries(formData.furnitureItems)
    .filter(([, qty]) => qty > 0)
    .flatMap(([id, qty]) => {
      const item = FURNITURE_CATALOG.find((f) => f.id === id);
      return item ? [{ id, label: item.label, icon: item.icon, qty }] : [];
    });

  // Prefill contact info from quick quote data stored in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('quickQuoteData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFormData((prev) => ({
          ...prev,
          contactName: parsed.name || prev.contactName,
          contactEmail: parsed.email || prev.contactEmail,
          contactPhone: parsed.phone || prev.contactPhone,
        }));
      } catch (err) {
        console.warn('Failed to parse quickQuoteData', err);
      }
    }

    // Prefill the starting address from a ?postal= param, e.g. coming from the
    // "toimimmeko alueellasi?" postal code checker on the homepage.
    const postal = searchParams.get('postal');
    if (postal) {
      setFormData((prev) => (prev.addressFrom ? prev : { ...prev, addressFrom: postal }));
    }
  }, [searchParams]);

  const initAutocomplete = () => {
    // AutocompleteService is initialized lazily in fetchPredictions
  };

  const fetchPredictions = (query: string, setter: (p: {description: string; place_id: string}[]) => void) => {
    if (!query || query.length < 2) { setter([]); return; }
    const google = (window as any).google;
    if (!google?.maps?.places) return;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, types: ['address'], componentRestrictions: { country: 'fi' } },
      (predictions: any[], status: string) => {
        if (predictions && status === 'OK') {
          setter(predictions.slice(0, 5).map((p: any) => ({ description: p.description, place_id: p.place_id })));
        } else {
          setter([]);
        }
      }
    );
  };

  // Re-initialize if the component mounts and google is already loaded
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      initAutocomplete();
    }
  }, [currentStep]); // Also re-init if we return to step 0

  // Calculate distance automatically using Google Maps Distance Matrix API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (!google || !google.maps || !formData.addressFrom || !formData.addressTo) return;

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
      origins: [formData.addressFrom],
      destinations: [formData.addressTo],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    }, (response: any, status: any) => {
      if (status === google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status === google.maps.DistanceMatrixElementStatus.OK) {
        const distanceInMeters = response.rows[0].elements[0].distance.value;
        const distanceInKm = Math.round(distanceInMeters / 1000);
        // Only update if distance is reasonable (between 1km and 500km)
        if (distanceInKm >= 1 && distanceInKm <= 500) {
          updateField('distanceKm', distanceInKm);
        }
      } else if (status !== google.maps.DistanceMatrixStatus.OK) {
        console.warn('Distance Matrix API error:', status);
      }
    });
  }, [formData.addressFrom, formData.addressTo]);

  const handleNext = () => {
    // Validate service step
    if (currentStep === 0 && !formData.serviceType) {
      toast.error('Valitse palvelu');
      return;
    }
    // Validate moving package step
    if (currentStep === 1 && formData.serviceType === 'moving' && !formData.movingPackage) {
      toast.error('Valitse muuttopaketti');
      return;
    }
    // Skip apartment details step for recycling (locations → inventory directly)
    if (currentStep === 1 && formData.serviceType === 'recycling') {
      setCurrentStep(3);
      return;
    }
    // Skip moving package step if not moving
    if (currentStep === 1 && formData.serviceType !== 'moving') {
      setCurrentStep(2);
      return;
    }
    // Validate locations step
    if (currentStep === 2 && (!formData.addressFrom || !formData.addressTo)) {
      toast.error('Täytä molemmat osoitteet');
      return;
    }
    const maxStep = formData.serviceType === 'moving' ? 6 : 5;
    setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  };

  const handleBack = () => {
    // Skip apartment details step going back for recycling (inventory → locations directly)
    if (currentStep === 3 && formData.serviceType === 'recycling') {
      setCurrentStep(1);
      return;
    }
    // If we're at a step after moving package and service is not moving, skip back one more
    if (currentStep === 2 && formData.serviceType !== 'moving') {
      setCurrentStep(0);
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const updateField = (field: keyof CalculatorData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const updateFurniture = (id: string, delta: number) => {
    setFormData((prev) => {
      const current = prev.furnitureItems[id] ?? 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev.furnitureItems };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return { ...prev, furnitureItems: updated };
    });
  };

  const addStop = () => {
    setFormData((prev) => ({ ...prev, additionalStops: [...prev.additionalStops, ''] }));
  };

  const updateStop = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalStops: prev.additionalStops.map((stop, i) => (i === index ? value : stop)),
    }));
  };

  const removeStop = (index: number) => {
    setFormData((prev) => ({ ...prev, additionalStops: prev.additionalStops.filter((_, i) => i !== index) }));
  };

  const [customItemLabel, setCustomItemLabel] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  const [customItemQty, setCustomItemQty] = useState(1);

  const addCustomItem = () => {
    const label = customItemLabel.trim();
    if (!label) return;
    setFormData((prev) => ({ ...prev, customItems: [...prev.customItems, { label, qty: customItemQty }] }));
    setCustomItemLabel('');
    setCustomItemQty(1);
  };

  const removeCustomItem = (index: number) => {
    setFormData((prev) => ({ ...prev, customItems: prev.customItems.filter((_, i) => i !== index) }));
  };

  const furnitureCategories = [...new Set(FURNITURE_CATALOG.map((f) => f.category))];
  const totalFurniturePieces = Object.values(formData.furnitureItems).reduce((s, n) => s + n, 0);

  // Laatikkomäärä luetaan suoraan tavaralistasta (ei erillistä liukusäädintä) jotta
  // työmäärä ei lasketa tuplana.
  const derivedBoxCount = Object.entries(formData.furnitureItems).reduce((sum, [id, qty]) => {
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    return item?.category === 'Laatikot ja pakkaukset' ? sum + qty : sum;
  }, 0);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gdprConsent) {
      toast.error('Hyväksy tietojen käsittely jatkaaksesi');
      return;
    }

    const phoneRegex = /^(\+358|0)(4[0-9]|50|9)[0-9\s\-]{5,}$/;
    if (!phoneRegex.test((formData.contactPhone ?? '').replace(/\s/g, ''))) {
      toast.error('Tarkista puhelinnumeron muoto (esim. 040 123 4567)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          data: {
            ...formData,
            boxCount: derivedBoxCount,
            price: priceResult.total,
            priceRangeLow: priceResult.priceRangeLow,
            priceRangeHigh: priceResult.priceRangeHigh,
            contactName: formData.contactName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            services: formData.services,
            status: 'NEW_BOOKING',
            gdpr_consent: gdprConsent,
            company: honeypot,
          }
        })
      });

      if (response.ok) {
        setIsBooked(true);
        toast.success('Varaus vastaanotettu! Olemme sinuun yhteydessä pian.');
      } else {
        throw new Error('Varaus epäonnistui');
      }
    } catch (err) {
      toast.error('Jotain meni pieleen. Yritä uudelleen tai soita meille.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <div className="text-center py-20 px-4 bg-white dark:bg-black shadow-xl rounded-2xl max-w-2xl mx-auto border border-gray-100 dark:border-gray-800">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Kiitos varauksestasi!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
          Olemme vastaanottaneet muuttovarauksesi. <br />
          Saat vahvistuksen sähköpostiisi pian ja olemme sinuun yhteydessä puhelimitse.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-all"
        >
          Palaa etusivulle
        </button>
      </div>
    );
  }

  return (
    <>
    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onReady={() => { scriptLoaded.current = true; }}
        onError={() => console.error('Google Maps script failed to load')}
      />
    )}
    <div
      ref={calculatorRef}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 scroll-mt-24"
    >
      {/* Progress Bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-4 sm:px-8 sm:py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          {STEPS.map((step, idx) => {
            // Skip moving package step if not moving
            if (idx === 1 && formData.serviceType !== 'moving') {
              return null;
            }

            // Adjust display index for steps after moving package
            const displayIdx = idx > 1 && formData.serviceType !== 'moving' ? idx - 1 : idx;
            const isCompleted = formData.serviceType === 'moving'
              ? idx < currentStep
              : (idx === 0 ? currentStep >= 0 : currentStep >= idx - 1);
            const isCurrent = formData.serviceType === 'moving'
              ? idx === currentStep
              : (idx === 0 ? currentStep === 0 : currentStep === idx - 1);

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1.5 transition-all ${
                    isCompleted || isCurrent
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {isCompleted && idx > 0 ? '✓' : displayIdx + 1}
                </div>
                <span className={`text-xs font-medium hidden md:block ${isCompleted || isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${
              formData.serviceType === 'moving'
                ? (currentStep / (STEPS.length - 1)) * 100
                : (currentStep / (STEPS.length - 2)) * 100
            }%` }}
          />
        </div>
      </div>

      <div className="p-5 sm:p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[260px] sm:min-h-[320px]"
          >
            {/* Step 0: Service Selection */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Valitse palvelu</h2>
                  <p className="text-gray-500">Mitä palvelua tarvitset?</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Muutto */}
                  <div
                    onClick={() => updateField('serviceType', 'moving')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.serviceType === 'moving'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <h3 className="font-bold text-lg mb-2">Muutto</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Kodin tai toimiston muutto uuteen osoitteeseen.
                    </p>
                  </div>

                  {/* Kuljetus */}
                  <div
                    onClick={() => updateField('serviceType', 'transport')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.serviceType === 'transport'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🚚</div>
                    <h3 className="font-bold text-lg mb-2">Kuljetus</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Yksittäisten tavaroiden, huonekalujen tai ostosten kuljetus.
                    </p>
                  </div>

                  {/* Kierrätys */}
                  <div
                    onClick={() => updateField('serviceType', 'recycling')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.serviceType === 'recycling'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">♻️</div>
                    <h3 className="font-bold text-lg mb-2">Kierrätys</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vanhojen huonekalujen, roskien ja ylimääräisten tavaroiden poisvienti.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Moving Package (only visible if service is moving) */}
            {currentStep === 1 && formData.serviceType === 'moving' && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Olet valinnut muuttopalvelun</h2>
                  <p className="text-gray-500 mb-8">Valitse muuttopaketti</p>
                </div>

                <div className="space-y-4">
                  {/* Täyspalvelu */}
                  <div
                    onClick={() => updateField('movingPackage', 'full_service')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.movingPackage === 'full_service'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Täyspalvelu</h3>
                        <span className="inline-block text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-3">
                          Suositeltu
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Kantajat, sopiva kuljetusauto ja vähintään herkimpien tavaroiden suojaus.
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                          formData.movingPackage === 'full_service'
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.movingPackage === 'full_service' && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vain kuljettaja ajoneuvolla */}
                  <div
                    onClick={() => updateField('movingPackage', 'driver_with_vehicle')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.movingPackage === 'driver_with_vehicle'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-3">Vain kuljettaja ajoneuvolla</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pääsen itse auttamaan kantamisessa.
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                          formData.movingPackage === 'driver_with_vehicle'
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.movingPackage === 'driver_with_vehicle' && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vain kantoapu */}
                  <div
                    onClick={() => updateField('movingPackage', 'carrying_help')}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.movingPackage === 'carrying_help'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-3">Vain kantoapu</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tarvitsen vain kantajat.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">89,90 €/h, min. 180 €</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                          formData.movingPackage === 'carrying_help'
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.movingPackage === 'carrying_help' && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Locations */}
            {currentStep === (formData.serviceType === 'moving' ? 2 : 1) && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
                    {formData.serviceType === 'transport' ? 'Mistä ja mihin kuljetetaan?' : 'Mistä ja mihin muutetaan?'}
                  </h2>
                  <p className="text-gray-500">Anna kohteiden osoitteet hinnan laskemiseksi.</p>
                </div>
                <div className="grid gap-6">
                  {(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === '') && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4 border border-red-100">
                      ⚠️ Google Maps API avain puuttuu. Osoitteiden automaattinen täyttö ei ole käytössä.
                    </div>
                  )}
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2">Lähtöosoite</label>
                    <input
                      ref={fromRef}
                      type="text"
                      autoComplete="off"
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Esim. Mannerheimintie 1, Helsinki"
                      value={formData.addressFrom}
                      onChange={(e) => { updateField('addressFrom', e.target.value); fetchPredictions(e.target.value, setFromPredictions); }}
                      onBlur={() => setTimeout(() => setFromPredictions([]), 150)}
                    />
                    {fromPredictions.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                        {fromPredictions.map((p) => (
                          <li
                            key={p.place_id}
                            className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { updateField('addressFrom', p.description); setFromPredictions([]); }}
                          >
                            {p.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2">Määränpää</label>
                    <input
                      ref={toRef}
                      type="text"
                      autoComplete="off"
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Esim. Hämeentie 10, Helsinki"
                      value={formData.addressTo}
                      onChange={(e) => { updateField('addressTo', e.target.value); fetchPredictions(e.target.value, setToPredictions); }}
                      onBlur={() => setTimeout(() => setToPredictions([]), 150)}
                    />
                    {toPredictions.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                        {toPredictions.map((p) => (
                          <li
                            key={p.place_id}
                            className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { updateField('addressTo', p.description); setToPredictions([]); }}
                          >
                            {p.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {formData.serviceType === 'transport' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold">Välipysähdykset (valinnainen)</label>
                        <button
                          type="button"
                          onClick={addStop}
                          className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all"
                        >
                          + Lisää välipysähdys
                        </button>
                      </div>
                      {formData.additionalStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder={`Välipysähdys ${index + 1} osoite`}
                            value={stop}
                            onChange={(e) => updateStop(index, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            className="w-10 h-10 flex-shrink-0 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {formData.additionalStops.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Muista huomioida välipysähdysten lisäämä matka alla olevassa etäisyysarviossa.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <label className="block text-sm font-semibold mb-2">Arvioitu etäisyys (km)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        className="flex-1 accent-primary"
                        value={formData.distanceKm}
                        onChange={(e) => updateField('distanceKm', parseInt(e.target.value))}
                      />
                      <span className="font-bold text-lg min-w-[60px]">{formData.distanceKm} km</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Apartment Details (not shown for recycling) */}
            {currentStep === (formData.serviceType === 'moving' ? 3 : 2) && formData.serviceType !== 'recycling' && (
              <div className="space-y-5">
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
                    {formData.serviceType === 'transport' ? 'Kuljettajat ja kohteet' : 'Asunnon koko ja kerrokset'}
                  </h2>
                  <p className="text-gray-500">Nämä vaikuttavat tarvittavaan aikaan ja miehitykseen.</p>
                </div>

                {formData.serviceType === 'transport' ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold mb-2 text-center">Kuljettajien määrä</label>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {(['1', '2'] as const).map((count) => (
                        <button
                          key={count}
                          onClick={() => updateField('driverCount', count)}
                          className={`py-4 rounded-xl border-2 transition-all font-bold ${
                            formData.driverCount === count
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {count} kuljettaja{count === '2' ? 'a' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(['1h', '2h', '3h', '4h+', 'office'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateField('apartmentSize', size)}
                        className={`py-4 rounded-xl border-2 transition-all font-bold ${
                          formData.apartmentSize === size
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5 pt-2">
                  <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                      Lähtökohde
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400">Kerros</label>
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-2 outline-none"
                          value={formData.floorFrom}
                          onChange={(e) => updateField('floorFrom', parseInt(e.target.value))}
                        >
                          {[0,1,2,3,4,5,6,7,8,9,10].map(f => <option key={f} value={f}>{f === 0 ? 'Katutaso' : `${f}. kerros`}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-12 h-6 rounded-full transition-all relative ${formData.elevatorFrom ? 'bg-primary' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.elevatorFrom ? 'left-7' : 'left-1'}`} />
                        </div>
                        <span className="font-medium">Hissi käytössä</span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.elevatorFrom}
                          onChange={(e) => updateField('elevatorFrom', e.target.checked)}
                        />
                      </label>
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400">Kantomatka ovelta autoon</label>
                        <p className="text-xs text-gray-400 mb-1">Matka ulko-ovelta muuttoauton luokse</p>
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-2 outline-none"
                          value={formData.carryDistanceFrom}
                          onChange={(e) => updateField('carryDistanceFrom', e.target.value)}
                        >
                          {CARRY_DISTANCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                      {formData.serviceType === 'transport' ? 'Toimitusosoite' : 'Uusi koti'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400">Kerros</label>
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-2 outline-none"
                          value={formData.floorTo}
                          onChange={(e) => updateField('floorTo', parseInt(e.target.value))}
                        >
                          {[0,1,2,3,4,5,6,7,8,9,10].map(f => <option key={f} value={f}>{f === 0 ? 'Katutaso' : `${f}. kerros`}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-12 h-6 rounded-full transition-all relative ${formData.elevatorTo ? 'bg-primary' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.elevatorTo ? 'left-7' : 'left-1'}`} />
                        </div>
                        <span className="font-medium">Hissi käytössä</span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.elevatorTo}
                          onChange={(e) => updateField('elevatorTo', e.target.checked)}
                        />
                      </label>
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400">Kantomatka autolta ovelle</label>
                        <p className="text-xs text-gray-400 mb-1">Matka muuttoauton luota kohteen ulko-ovelle</p>
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-2 outline-none"
                          value={formData.carryDistanceTo}
                          onChange={(e) => updateField('carryDistanceTo', e.target.value)}
                        >
                          {CARRY_DISTANCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Inventory */}
            {currentStep === (formData.serviceType === 'moving' ? 4 : 3) && (
              <div className="space-y-5">
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">{getInventoryLabel()}</h2>
                  <p className="text-gray-500">Tavaralista on tärkein tekijä hinta-arviossa — mitä tarkempi lista, sitä tarkempi hinta.</p>
                </div>

                {/* Quick presets (only for moving) */}
                {formData.serviceType === 'moving' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Pikavalinnat</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {([
                        { label: 'Tyhjä / muutama asia', items: {} },
                        {
                          label: 'Tyypillinen 1h',
                          items: { sofa_2: 1, bed_140: 1, wardrobe_assembled: 1, coffee_table: 1, bookshelf: 1, nightstand: 1, dresser_small: 1, box_standard: 10 },
                        },
                        {
                          label: 'Tyypillinen 2h',
                          items: { sofa_3: 1, bed_140: 1, bed_80: 1, wardrobe_assembled: 2, coffee_table: 1, bookshelf: 2, nightstand: 2, dresser_small: 1, dining_table_small: 1, kitchen_chair: 4, box_standard: 20 },
                        },
                        {
                          label: 'Tyypillinen 3h',
                          items: { sofa_3: 1, sofa_2: 1, bed_140: 1, bed_80: 2, wardrobe_assembled: 3, coffee_table: 1, bookshelf: 3, nightstand: 2, dresser_large: 1, dining_table_large: 1, kitchen_chair: 6, box_standard: 35 },
                        },
                      ] as { label: string; items: Record<string, number> }[]).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateField('furnitureItems', preset.items)}
                          className="p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Pikavalinta täyttää tyypillisen tavaralistan — muokkaa vapaasti alta.</p>
                  </div>
                )}

                {/* Waste type selector (only for recycling) */}
                {formData.serviceType === 'recycling' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">Jätteen laji</h3>
                    <p className="text-sm text-gray-500">Valitse kaikki jätetyypit — kierrätysmaksu lisätään automaattisesti hintaan.</p>
                    <div className="grid gap-3">
                      {RECYCLING_WASTE_TYPES.map((wt) => {
                        const selected = (formData.selectedWasteTypes ?? []).includes(wt.id);
                        return (
                          <div
                            key={wt.id}
                            onClick={() => {
                              const current = formData.selectedWasteTypes ?? [];
                              const next = selected ? current.filter((id) => id !== wt.id) : [...current, wt.id];
                              updateField('selectedWasteTypes', next);
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                              selected ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                {selected && <span className="text-white text-xs">✓</span>}
                              </div>
                              <span className="text-xl">{wt.icon}</span>
                              <div>
                                <p className="font-semibold text-sm">{wt.label}</p>
                                <p className="text-xs text-gray-500">{wt.description}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold flex-shrink-0 ${wt.disposalCostPerLoad === 0 ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                              {wt.disposalCostPerLoad === 0 ? 'Ilmainen' : `+${wt.disposalCostPerLoad} €/erä`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Furniture List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Huonekalut ja laatikot</h3>
                    {totalFurniturePieces > 0 && (
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {totalFurniturePieces} kpl valittu ({derivedBoxCount} laatikkoa)
                      </span>
                    )}
                  </div>
                  {furnitureCategories.map((category) => {
                    const isOpen = expandedCategories.has(category);
                    const categoryItems = FURNITURE_CATALOG.filter((f) => f.category === category);
                    const selectedCount = categoryItems.reduce((sum, item) => sum + (formData.furnitureItems[item.id] ?? 0), 0);
                    return (
                    <div key={category} className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full bg-gray-50 dark:bg-gray-800/60 px-5 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{category}</span>
                          {selectedCount > 0 && (
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedCount} kpl</span>
                          )}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                      <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {categoryItems.map((item) => {
                          const qty = formData.furnitureItems[item.id] ?? 0;
                          return (
                            <div key={item.id} className="flex items-center justify-between px-5 py-3">
                              <span className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium text-sm">{item.label}</span>
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateFurniture(item.id, -1)}
                                  disabled={qty === 0}
                                  className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:border-primary hover:text-primary transition-all"
                                >
                                  -
                                </button>
                                <span className={`w-6 text-center font-bold text-sm ${qty > 0 ? 'text-primary' : 'text-gray-300'}`}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateFurniture(item.id, 1)}
                                  className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg font-bold hover:border-primary hover:text-primary transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                  );
                })}
                </div>

                {/* Mukautetut tavarat — jos tavaraa ei löydy katalogista */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                    <h3 className="font-bold text-sm mb-1">Tavaraa ei löydy listalta?</h3>
                    <p className="text-xs text-gray-500 mb-4">Kirjoita tavaran nimi ja määrä, ja lisäämme sen arvioon.</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                        placeholder="Esim. Akvaario, soutuvene, jääkellari..."
                        value={customItemLabel}
                        onChange={(e) => setCustomItemLabel(e.target.value)}
                      />
                      <input
                        type="number"
                        min={1}
                        className="w-20 px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none text-sm text-center"
                        value={customItemQty}
                        onChange={(e) => setCustomItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button
                        type="button"
                        onClick={addCustomItem}
                        className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
                      >
                        Lisää
                      </button>
                    </div>
                    {formData.customItems.length > 0 && (
                      <div className="mt-4 divide-y divide-gray-50 dark:divide-gray-800 border-t border-gray-50 dark:border-gray-800">
                        {formData.customItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium">{item.label} × {item.qty}</span>
                            <button
                              type="button"
                              onClick={() => removeCustomItem(index)}
                              className="w-7 h-7 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition-all"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    onClick={() => toggleService('Muuttolaatikot')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      formData.services.includes('Muuttolaatikot') ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.services.includes('Muuttolaatikot') ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}
                    >
                      {formData.services.includes('Muuttolaatikot') && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">Muuttolaatikot</h4>
                      <p className="text-xs text-gray-500">Laatikoiden toimitus ja nouto</p>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleService('Purkupalvelu')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      formData.services.includes('Purkupalvelu') ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.services.includes('Purkupalvelu') ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}
                    >
                      {formData.services.includes('Purkupalvelu') && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">Purkupalvelu</h4>
                      <p className="text-xs text-gray-500">Huonekalujen purku ja kasaus</p>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleService('Kierrätys')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      formData.services.includes('Kierrätys') ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.services.includes('Kierrätys') ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}
                    >
                      {formData.services.includes('Kierrätys') && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">Kierrätys & jäte</h4>
                      <p className="text-xs text-gray-500">Poistettavien tavaroiden kierrätys</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    onClick={() => updateField('needsPacking', !formData.needsPacking)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      formData.needsPacking ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.needsPacking ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                      {formData.needsPacking && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className="font-bold">Pakkauspalvelu</h4>
                      <p className="text-xs text-gray-500">Me pakkaamme tavarat puolestasi</p>
                    </div>
                  </div>
                  <div
                    onClick={() => updateField('needsCleaning', !formData.needsCleaning)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      formData.needsCleaning ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.needsCleaning ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                      {formData.needsCleaning && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className="font-bold">Muuttosiivous</h4>
                      <p className="text-xs text-gray-500">Vanhan asunnon loppusiivous</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Quote */}
            {currentStep === (formData.serviceType === 'moving' ? 5 : 4) && (
              <div className="space-y-5">
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
                    {formData.serviceType === 'transport' ? 'Kuljetuksen hinta-arvio' : 'Hinta-arviosi'}
                  </h2>
                  <p className="text-gray-500">Laskettu annettujen tietojen perusteella.</p>
                </div>

                {/* Trust signals */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">🛡️ Vakuutus sisältyy</span>
                  <span className="flex items-center gap-1.5">✅ Ei piilokuluja</span>
                  <span className="flex items-center gap-1.5">📋 Hinta-arvio ei sido sinua</span>
                </div>

                <div className="max-w-xs mx-auto">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2 text-center">
                    Muuttopäivä (vaikuttaa hintaan)
                  </label>
                  <input
                    type="date"
                    className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none text-center"
                    value={formatDateInput(formData.date)}
                    onChange={(e) => updateField('date', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                  {!formData.date && (
                    <p className="text-xs text-gray-400 text-center mt-2">Valitse päivä nähdäksesi voiko ajankohta tuoda alennusta.</p>
                  )}
                </div>

                <div className="flex justify-center gap-3 flex-wrap">
                  {(formData.serviceType === 'moving' || formData.serviceType === 'transport') && (
                    <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <span>{DIFFICULTY_BADGES[priceResult.difficultyLevel].emoji}</span>
                      {DIFFICULTY_BADGES[priceResult.difficultyLevel].label}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <span>{priceResult.dateDiscountEmoji}</span>
                    {priceResult.dateDiscountLabel}
                  </span>
                </div>

                <div className="bg-primary text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-primary-foreground/80 font-medium mb-1">Arvioitu muuttosi</p>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl sm:text-5xl font-black">
                          {priceResult.priceRangeLow}–{priceResult.priceRangeHigh}€
                        </span>
                        <span className="text-xl font-bold mb-2">sis. ALV</span>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                        <div>
                          <p className="text-xs uppercase font-bold text-white/60 mb-1">Arvioitu kesto</p>
                          <p className="text-xl font-bold">{priceResult.estimatedDurationHours} tuntia</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-white/60 mb-1">Tiimi</p>
                          <p className="text-xl font-bold">
                            {formData.serviceType === 'transport'
                              ? `${formData.driverCount} kuljettaja${formData.driverCount === '2' ? 'a' : ''} + pakettiauto`
                              : formData.movingPackage === 'driver_with_vehicle'
                                ? 'Kuljettaja + Kuorma-auto'
                                : formData.movingPackage === 'carrying_help'
                                  ? '2 kantajaa'
                                  : 'Kuorma-auto + 2 miestä'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-white/60 mb-1">Muuttoauto</p>
                          <p className="text-xl font-bold">Sopiva kuorma-auto</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-white/60 mb-1">Vakuutus</p>
                          <p className="text-xl font-bold">Sisältyy</p>
                        </div>
                        {formData.serviceType === 'transport' && formData.additionalStops.length > 0 && (
                          <div>
                            <p className="text-xs uppercase font-bold text-white/60 mb-1">Välipysähdykset</p>
                            <p className="text-xl font-bold">+{formData.additionalStops.length}</p>
                          </div>
                        )}
                      </div>
                   </div>
                   <CalcIcon className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
                </div>

                {priceResult.dateDiscountAmount > 0 && (
                  <div className="grid gap-3">
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Normaalihinta</span>
                      <span className="font-bold">{Math.round(priceResult.normalPriceTotal)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                      <span className="text-green-700 dark:text-green-300">
                        Hiljaisen päivän alennus ({Math.round(priceResult.dateDiscountFraction * 100)}%)
                      </span>
                      <span className="font-bold text-green-700 dark:text-green-300">-{Math.round(priceResult.dateDiscountAmount)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-primary/5">
                      <span className="font-semibold">Lopullinen arvio</span>
                      <span className="font-bold">{priceResult.priceRangeLow}–{priceResult.priceRangeHigh}€</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-gray-400">Sisältää</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {getIncludedServices().map((service) => (
                      <div key={service} className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600 dark:text-gray-300">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(formData.serviceType === 'moving' || formData.serviceType === 'transport') && (
                  <div className="grid gap-3">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-400">Mistä hinta muodostuu</h3>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Tavaramäärän vaikutus</span>
                      <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.items)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Kerrosten ja hissin vaikutus</span>
                      <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.floors)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Kantomatkan vaikutus</span>
                      <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.carryDistance)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">{formData.serviceType === 'transport' ? 'Kuljetusmatkan vaikutus' : 'Muuttomatkan vaikutus'}</span>
                      <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.distance)}€</span>
                    </div>
                    {priceResult.details.impactBreakdown.extras > 0 && (
                      <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-gray-500">
                          {formData.serviceType === 'transport' ? 'Välipysähdysten vaikutus' : 'Lisäpalveluiden vaikutus'}
                        </span>
                        <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.extras)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Koordinointiaika (kiinteä, auton valmistelu ja paperityöt)</span>
                      <span className="font-bold">{Math.round(priceResult.details.impactBreakdown.base)}€</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-primary/5 font-semibold">
                      <span>Yhteensä (ennen muuttopäivän alennusta)</span>
                      <span>{Math.round(priceResult.normalPriceTotal)}€</span>
                    </div>
                  </div>
                )}

                {formData.serviceType === 'recycling' && (
                  <div className="grid gap-3">
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">Työkustannukset ({priceResult.details.laborHours}h)</span>
                      <span className="font-bold">{Math.round(priceResult.laborCost)}€</span>
                    </div>
                    {priceResult.disposalCost > 0 && (
                      <div className="flex justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-gray-500">
                          Kierrätysmaksut ({(formData.selectedWasteTypes ?? [])
                            .map((id) => RECYCLING_WASTE_TYPES.find((w) => w.id === id)?.label)
                            .filter(Boolean)
                            .join(', ')})
                        </span>
                        <span className="font-bold">{Math.round(priceResult.disposalCost)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-gray-500">
                        {priceResult.details.distanceKm > 0
                          ? `Kilometrikorvaukset (${Math.round(priceResult.details.distanceKm)} km)`
                          : `Kilometrit sisältyvät hintaan (${INCLUDED_DISTANCE_KM} km asti)`}
                      </span>
                      <span className="font-bold">{Math.round(priceResult.distanceCost)}€</span>
                    </div>
                  </div>
                )}

                {(formData.serviceType === 'moving' || formData.serviceType === 'transport') && selectedInventoryItems.length > 0 && (
                  <div className="grid gap-3">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-400">Lisätyt tavarat</h3>
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden">
                      {selectedInventoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-5 py-3">
                          <span className="flex items-center gap-3 text-sm font-medium">
                            <span className="text-xl">{item.icon}</span>
                            {item.label}
                          </span>
                          <span className="font-bold text-sm">× {item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-black text-primary">{priceResult.details.totalItemCount}</p>
                        <p className="text-xs text-gray-400">tavaraa yhteensä</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-black text-primary">{priceResult.details.totalVolumeM3.toFixed(1)}</p>
                        <p className="text-xs text-gray-400">m³ arvioitu tilavuus</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-black text-primary">{priceResult.estimatedDurationHours}</p>
                        <p className="text-xs text-gray-400">h arvioitu työaika</p>
                      </div>
                    </div>
                  </div>
                )}

                {priceResult.inventoryWarning && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 flex gap-4">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm text-orange-800 dark:text-orange-200">{priceResult.inventoryWarning}</p>
                  </div>
                )}


                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex gap-4">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Tämä on automaattinen arvio. Lopullinen hinta vahvistetaan kun asiantuntijamme on käynyt tiedot läpi.
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Booking */}
            {currentStep === (formData.serviceType === 'moving' ? 6 : 5) && (
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">Viimeistele varaus</h2>
                  <p className="text-gray-500">
                    {formData.serviceType === 'transport' ? 'Valitse kuljetuspäivä' : 'Valitse muuttopäivä'} ja jätä yhteystietosi.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> Toivottu muuttopäivä
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
                        value={formatDateInput(formData.date)}
                        onChange={(e) => updateField('date', e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Nimi</label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Etunimi Sukunimi"
                        value={formData.contactName || ''}
                        onChange={(e) => updateField('contactName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Sähköposti</label>
                      <input
                        type="email"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="posti@esimerkki.fi"
                        value={formData.contactEmail || ''}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Puhelinnumero</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="040 123 4567"
                        value={formData.contactPhone || ''}
                        onChange={(e) => updateField('contactPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Honeypot value={honeypot} onChange={setHoneypot} />

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-4">
                    Lähetämme sinulle lopullisen tarjouksen sähköpostiin — ei sitovia lupauksia vielä. Emme veloita mitään ennen kuin olet hyväksynyt tarjouksen.
                  </p>
                  <div className="mb-4">
                    <GdprConsentCheckbox checked={gdprConsent} onChange={setGdprConsent} />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Lähetetään pyyntöä...
                      </>
                    ) : (
                      <>
                        Lähetä tarjouspyyntö
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep < (formData.serviceType === 'moving' ? 6 : 5) && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl font-bold transition-all ${
                currentStep === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Takaisin
            </button>
            <button
              onClick={handleNext}
              className="bg-black dark:bg-white dark:text-black text-white px-8 sm:px-12 py-3.5 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-xl"
            >
              {currentStep === (formData.serviceType === 'moving' ? 5 : 4) ? 'Siirry varaukseen' : 'Seuraava'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
