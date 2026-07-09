import { Camera } from 'lucide-react';

const IMAGES = [
  { src: '/images/gallery-1.png', alt: 'بيوت حجرية شامخة على سفح الجبل', span: 'md:row-span-2' },
  { src: '/images/gallery-2.png', alt: 'زقاق تراثي قديم بين البيوت الحجرية', span: '' },
  { src: '/images/gallery-3.png', alt: 'نافذة قمرية ملونة بزخارف جصية', span: '' },
  { src: '/images/gallery-4.png', alt: 'مدرجات زراعية خضراء عند الغروب', span: 'md:col-span-2' },
  { src: '/images/gallery-5.png', alt: 'باب خشبي منقوش لبيت تراثي', span: '' },
  { src: '/images/gallery-6.png', alt: 'منظر جوي للقرية بين الجبال عند الفجر', span: '' },
];

export default function LandingGallery() {
  return (
    <section id="gallery" className="bg-cream-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream-200 px-4 py-1.5 text-sm font-bold text-maroon-800">
            <Camera className="h-4 w-4" />
            المعرض الرقمي
          </span>
          <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
            جمال القرية ومعالمها بعدسة رقمية
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-ink-500">
            مجموعة مختارة من الصور توثّق روعة العمارة التراثية والطبيعة الساحرة في قرية ذي الجمال.
          </p>
        </div>

        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {IMAGES.map((img) => (
            <figure
              key={img.src}
              className={`group relative overflow-hidden rounded-2xl shadow-sm ${img.span}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-maroon-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-3 p-4 text-sm font-semibold text-cream-50 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {img.alt}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
