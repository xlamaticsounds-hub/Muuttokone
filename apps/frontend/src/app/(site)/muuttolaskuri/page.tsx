import CalculatorGuide from '@/features/city-pages/CalculatorGuide';
import CalculatorPageBody from './CalculatorPageBody';

// Suomenkielinen laskurisivu: laskuri + ohjeosio (hinnan muodostuminen, esimerkkihinnat, UKK).
export default function MuuttolaskuriPage() {
  return (
    <>
      <CalculatorPageBody />
      <CalculatorGuide />
    </>
  );
}
