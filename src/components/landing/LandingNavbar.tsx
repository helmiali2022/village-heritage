import { useState, useEffect } from 'react';
import { Menu, X, LogIn, Search, Landmark } from 'lucide-react';

interface NavLink {
  label: string;
  id: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'الرئيسية', id: 'home' },
  { label: 'عن القرية', id: 'about' },
  { label: 'التعداد', id: 'statistics' },
  { label: 'أخبارنا', id: 'news' },
  { label: 'المعرض', id: 'gallery' },
  { label: 'اتصل بنا', id: 'contact' },
];

export default function LandingNavbar({ onEnter }: { onEnter: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream-50/95 shadow-[0_2px_20px_rgba(63,16,17,0.12)] backdrop-blur'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand — right side in RTL */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('home');
          }}
          className="flex items-center gap-3"
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              scrolled ? 'bg-maroon-800 text-cream-100' : 'bg-cream-50/15 text-cream-50 ring-1 ring-cream-50/30'
            }`}
          >
            <Landmark className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span
              className={`block text-base font-extrabold sm:text-lg ${
                scrolled ? 'text-maroon-800' : 'text-cream-50'
              }`}
            >
              قرية ذي الجمال
            </span>
            <span
              className={`block text-xs font-medium ${
                scrolled ? 'text-ink-500' : 'text-cream-200/90'
              }`}
            >
              المنصة الرقمية — قدس
            </span>
          </span>
        </a>

        {/* Desktop links — left side in RTL */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                scrolled
                  ? 'text-ink-700 hover:bg-cream-100 hover:text-maroon-800'
                  : 'text-cream-100 hover:bg-cream-50/10 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEnter}
            className={`hidden items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 sm:inline-flex ${
              scrolled
                ? 'bg-maroon-800 text-cream-50 hover:bg-maroon-700'
                : 'bg-cream-50 text-maroon-800 hover:bg-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            الدخول للمنصة
          </button>
          <button
            onClick={onEnter}
            aria-label="بحث"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
              scrolled
                ? 'text-maroon-800 hover:bg-cream-100'
                : 'text-cream-50 hover:bg-cream-50/10'
            }`}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            aria-expanded={open}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg lg:hidden ${
              scrolled ? 'text-maroon-800 hover:bg-cream-100' : 'text-cream-50 hover:bg-cream-50/10'
            }`}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-cream-200 bg-cream-50 shadow-lg lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full rounded-lg px-4 py-3 text-right text-base font-semibold text-ink-700 transition-colors hover:bg-cream-100 hover:text-maroon-800"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={onEnter}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-maroon-800 px-4 py-3 text-base font-bold text-cream-50"
            >
              <LogIn className="h-5 w-5" />
              الدخول للمنصة
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
