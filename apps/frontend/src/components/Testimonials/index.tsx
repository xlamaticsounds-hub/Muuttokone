import SectionTitle from '@/components/SectionTitle';
import Image from 'next/image';

const testimonialData = [
  {
    id: 1,
    name: 'Matti V.',
    designation: 'Helsinki',
    content: 'Aivan loistava palvelu! Kaikki hoitui ajallaan ja muuttomiehet olivat todella ystävällisiä. Suosittelen!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Anna K.',
    designation: 'Espoo',
    content: 'Hinta-arvio piti paikkansa täydellisesti. Ei yllätyksiä, vain tehokasta toimintaa.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Juha L.',
    designation: 'Vantaa',
    content: 'Muutto sujui paljon nopeammin kuin olin ajatellut. Iso kiitos ammattitaitoiselle tiimille!',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-1 dark:bg-blacksection py-20 lg:py-25">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top mb-15 text-center">
          <SectionTitle
            title="Asiakkaiden kokemuksia"
            subtitle="Tuhannet tyytyväiset asiakkaat luottavat Muuttokoneeseen. Lue mitä he sanovat."
          />
        </div>

        <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {testimonialData.map((review) => (
            <div
              key={review.id}
              className="animate_top rounded-lg bg-white p-9 shadow-solid-8 dark:bg-blacksection dark:border dark:border-strokedark"
            >
              <div className="mb-7.5 flex justify-between border-b border-stroke pb-6 dark:border-strokedark">
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-black dark:text-white">
                    {review.name}
                  </h3>
                  <p className="text-sm">{review.designation}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-black/70 dark:text-white/70">"{review.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
