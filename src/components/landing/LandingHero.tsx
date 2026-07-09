import { Compass, Newspaper, ChevronDown } from 'lucide-react';

export default function LandingHero({ onEnter }: { onEnter: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background image */}
      <img
        src="/images/hero-village.png"
        alt="منظر بانورامي لقرية ذي الجمال التراثية عند الغروب"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Maroon gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-maroon-950/95 via-maroon-900/80 to-maroon-800/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-maroon-950/30" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-maroon-950/30 px-4 py-1.5 text-sm font-semibold text-gold-500 backdrop-blur"
            style={{ animation: 'hv-fade-up 0.6s ease-out both' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            أصالة الماضي بلغة الحاضر الرقمي
          </span>

          <h1
            className="text-balance text-4xl font-extrabold leading-tight text-cream-50 sm:text-5xl lg:text-6xl"
            style={{ animation: 'hv-fade-up 0.7s ease-out 0.1s both' }}
          >
            أهلاً بكم في المنصة الرقمية
            <span className="mt-2 block text-gold-500">لقرية ذي الجمال — قدس</span>
          </h1>

          <p
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-cream-200/95"
            style={{ animation: 'hv-fade-up 0.7s ease-out 0.2s both' }}
          >
            نافذتكم إلى تاريخ عريق وتراث أصيل يمتد عبر الأجيال. نجمع بين عبق الماضي
            ومعالم القرية الخالدة، وبين خدمات رقمية حديثة تخدم أهالي القرية وزوارها.
          </p>

          <div
            className="mt-9 flex flex-col gap-3 sm:flex-row"
            style={{ animation: 'hv-fade-up 0.7s ease-out 0.3s both' }}
          >
            <button
              onClick={() => scrollTo('about')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-7 py-3.5 text-base font-bold text-maroon-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gold-600"
            >
              <Compass className="h-5 w-5" />
              استكشف القرية
            </button>
            <button
              onClick={() => scrollTo('news')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cream-50/40 bg-cream-50/10 px-7 py-3.5 text-base font-bold text-cream-50 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-cream-50/20"
            >
              <Newspaper className="h-5 w-5" />
              آخر الأخبار
            </button>
          </div>

          <div
            className="mt-12 flex flex-wrap gap-8 border-t border-cream-50/15 pt-8"
            style={{ animation: 'hv-fade-up 0.7s ease-out 0.4s both' }}
          >
            {[
              { value: '+300', label: 'عام من التاريخ' },
              { value: '6', label: 'محلات سكنية' },
              { value: '100%', label: 'تراث محفوظ' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-cream-50">{s.value}</div>
                <div className="text-sm text-cream-200/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo('about')}
        aria-label="انزل للأسفل"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-cream-50/70 transition-colors hover:text-cream-50"
      >
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </button>
    </section>
  );
}
