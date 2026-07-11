'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Users, Home, Building2, Trees } from 'lucide-react';

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  icon: ReactNode;
  color: string;
}

const stats: Stat[] = [
  {
    value: 2850,
    label: 'عدد السكان',
    suffix: '+',
    icon: <Users className="h-6 w-6" />,
    color: 'from-maroon-800 to-maroon-700',
  },
  {
    value: 410,
    label: 'عدد المساكن',
    suffix: '',
    icon: <Home className="h-6 w-6" />,
    color: 'from-gold-600 to-gold-500',
  },
  {
    value: 89,
    label: 'المباني التراثية',
    suffix: '%',
    icon: <Building2 className="h-6 w-6" />,
    color: 'from-ink-900 to-ink-700',
  },
  {
    value: 1240,
    label: 'الأشجار والمساحات',
    suffix: '',
    icon: <Trees className="h-6 w-6" />,
    color: 'from-cream-200 to-cream-100',
  },
];

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);

    const interval = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value]);

  return <>{count}</>;
}

export default function LandingStatistics() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated]);

  return (
    <section id="statistics" ref={sectionRef} className="relative py-20 sm:py-28">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-maroon-900/15 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gold-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-extrabold text-ink-900 sm:text-4xl">
            تعداد السكان والمساكن
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            معلومات إحصائية شاملة عن قرية ذي الجمال تعكس نموها وتطورها المستدام
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl bg-cream-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                animation: hasAnimated ? `hv-fade-up 0.6s ease-out ${0.1 * idx}s both` : 'none',
              }}
            >
              {/* Card background gradient */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              {/* Icon container */}
              <div
                className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white transition-all duration-300 group-hover:scale-110`}
              >
                {stat.icon}
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-maroon-900">
                    {hasAnimated ? (
                      <AnimatedCounter value={stat.value} />
                    ) : (
                      '0'
                    )}
                  </span>
                  {stat.suffix && (
                    <span className="text-2xl font-bold text-maroon-800">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-ink-700">
                  {stat.label}
                </p>
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-maroon-800 to-gold-500 transition-all duration-300 group-hover:w-full rounded-b-2xl" />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 rounded-xl border border-maroon-800/20 bg-maroon-950/5 px-6 py-4 text-center">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-maroon-800">آخر تحديث:</span> إحصائيات
            {' '}
            <span className="font-bold">2025</span>
            {' '}
            تم جمعها من السجلات الرسمية لقرية ذي الجمال
          </p>
        </div>
      </div>
    </section>
  );
}
