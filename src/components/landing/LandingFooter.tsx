import { Landmark, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'الرئيسية', id: 'home' },
  { label: 'عن القرية', id: 'about' },
  { label: 'أخبارنا', id: 'news' },
  { label: 'المعرض', id: 'gallery' },
];

const SOCIALS = [
  { icon: Facebook, label: 'فيسبوك' },
  { icon: Twitter, label: 'إكس' },
  { icon: Instagram, label: 'إنستغرام' },
  { icon: Youtube, label: 'يوتيوب' },
];

export default function LandingFooter({ onEnter }: { onEnter: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer id="contact" className="bg-maroon-950 text-cream-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-maroon-950">
                <Landmark className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold text-cream-50">قرية ذي الجمال</span>
                <span className="block text-xs text-cream-300">المنصة الرقمية — قدس</span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-cream-200/80">
              منصة رقمية تجمع أبناء قرية ذي الجمال وتوثّق تراثها العريق وتربط الماضي الأصيل بالحاضر الحديث.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-800 text-cream-100 transition-all hover:-translate-y-1 hover:bg-gold-500 hover:text-maroon-950"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-5 text-base font-bold text-cream-50">روابط سريعة</h3>
            <ul className="space-y-3 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => scrollTo(l.id)}
                    className="text-cream-200/80 transition-colors hover:text-gold-500"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={onEnter} className="text-cream-200/80 transition-colors hover:text-gold-500">
                  الدخول للمنصة
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-base font-bold text-cream-50">تواصل معنا</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
                <span>قرية ذي الجمال، مديرية قدس، محافظة صنعاء، اليمن</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-gold-500" />
                <span dir="ltr">+967 000 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-gold-500" />
                <span dir="ltr">info@thialjamal.ye</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-5 text-base font-bold text-cream-50">النشرة البريدية</h3>
            <p className="text-sm text-cream-200/80">اشترك ليصلك جديد أخبار القرية وفعالياتها.</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                type="email"
                required
                placeholder="بريدك الإلكتروني"
                className="rounded-lg border border-maroon-700 bg-maroon-900 px-4 py-2.5 text-sm text-cream-50 placeholder:text-cream-300/60 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
              <button
                type="submit"
                className="rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-maroon-950 transition-colors hover:bg-gold-600"
              >
                اشتراك
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-maroon-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-cream-200/70 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} المنصة الرقمية لقرية ذي الجمال — قدس. جميع الحقوق محفوظة.</p>
          <p>
            صُمّم بكل <span className="text-gold-500">فخر</span> لخدمة أبناء القرية
          </p>
        </div>
      </div>
    </footer>
  );
}
