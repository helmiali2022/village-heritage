import { MapPin, ScrollText, Landmark, Mountain } from 'lucide-react';

const FEATURES = [
  { icon: MapPin, title: 'الموقع', text: 'تقع في مديرية قدس، محافظة صنعاء، بين أحضان الجبال الخضراء.' },
  { icon: ScrollText, title: 'التاريخ', text: 'قرية عريقة يمتد تاريخها لقرون، شاهدة على حضارة يمنية أصيلة.' },
  { icon: Landmark, title: 'الإرث المعماري', text: 'بيوت حجرية شامخة بزخارف جصية بيضاء تروي حكاية الأجداد.' },
  { icon: Mountain, title: 'الطبيعة', text: 'مدرجات زراعية خضراء وطبيعة خلابة تسر الناظرين في كل فصل.' },
];

export default function LandingAbout() {
  return (
    <section id="about" className="bg-cream-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(63,16,17,0.25)]">
              <img
                src="/images/about-village.png"
                alt="واجهة بيت تراثي في قرية ذي الجمال بزخارف جصية"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-maroon-800 px-7 py-5 text-cream-50 shadow-xl sm:block">
              <div className="text-3xl font-extrabold text-gold-500">ذي الجمال</div>
              <div className="text-sm text-cream-200">جوهرة قدس التراثية</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cream-200 px-4 py-1.5 text-sm font-bold text-maroon-800">
              عن القرية
            </span>
            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
              قرية تنبض بعبق التاريخ وأصالة التراث
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-ink-700">
              قرية ذي الجمال في مديرية قدس هي واحدة من القرى اليمنية العريقة التي حافظت
              على طابعها التراثي الأصيل. تتميز بعمارتها الحجرية الفريدة، ومدرجاتها الزراعية
              المتدرجة على سفوح الجبال، وأهلها الكرام الذين توارثوا العادات والتقاليد الأصيلة
              جيلاً بعد جيل.
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-ink-700">
              تسعى هذه المنصة الرقمية لتوثيق هذا الإرث الحضاري وتقريبه من أبناء القرية في
              الداخل والخارج، وربط الماضي العريق بأدوات العصر الحديث.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-cream-200 bg-cream-100/60 p-5 transition-all hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-lg"
                >
                  <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-maroon-800 text-cream-50 transition-colors group-hover:bg-gold-500 group-hover:text-maroon-950">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-ink-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
