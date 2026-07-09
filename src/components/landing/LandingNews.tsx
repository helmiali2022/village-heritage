import { Calendar, ArrowLeft } from 'lucide-react';

const NEWS = [
  {
    img: '/images/news-1.png',
    tag: 'فعاليات',
    date: '15 رمضان 1447 هـ',
    title: 'ملتقى أبناء القرية السنوي لتعزيز التواصل الاجتماعي',
    excerpt: 'شهدت ساحة القرية تجمعاً كبيراً لأبناء القرية في الداخل والخارج ضمن الملتقى السنوي.',
  },
  {
    img: '/images/news-2.png',
    tag: 'تنمية',
    date: '2 شعبان 1447 هـ',
    title: 'انطلاق مبادرة إحياء المدرجات الزراعية التراثية',
    excerpt: 'أطلق أهالي القرية مبادرة تطوعية لإعادة تأهيل المدرجات الزراعية والحفاظ على إرثها.',
  },
  {
    img: '/images/news-3.png',
    tag: 'خدمات',
    date: '20 رجب 1447 هـ',
    title: 'افتتاح مشروع ترميم الجامع التاريخي في القرية',
    excerpt: 'اكتملت أعمال ترميم الجامع التاريخي بما يحافظ على طابعه المعماري الأصيل.',
  },
];

export default function LandingNews() {
  return (
    <section id="news" className="bg-cream-100 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cream-200 px-4 py-1.5 text-sm font-bold text-maroon-800">
              أخبار وفعاليات
            </span>
            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
              آخر أخبار وفعاليات القرية
            </h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-maroon-800 transition-colors hover:text-maroon-600">
            جميع الأخبار
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((item) => (
            <article
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-3xl border border-cream-200 bg-cream-50 shadow-sm transition-all hover:-translate-y-2 hover:shadow-[0_18px_50px_rgba(63,16,17,0.18)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute right-4 top-4 rounded-full bg-maroon-800/95 px-3 py-1 text-xs font-bold text-cream-50 backdrop-blur">
                  {item.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
                  <Calendar className="h-4 w-4 text-gold-600" />
                  {item.date}
                </div>
                <h3 className="text-balance text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-maroon-800">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{item.excerpt}</p>
                <button className="mt-5 inline-flex items-center gap-2 self-start text-sm font-bold text-maroon-800 transition-all group-hover:gap-3 group-hover:text-maroon-600">
                  اقرأ المزيد
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
