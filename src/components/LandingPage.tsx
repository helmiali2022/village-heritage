import LandingNavbar from './landing/LandingNavbar';
import LandingHero from './landing/LandingHero';
import LandingAbout from './landing/LandingAbout';
import LandingNews from './landing/LandingNews';
import LandingGallery from './landing/LandingGallery';
import LandingFooter from './landing/LandingFooter';

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-cream-50">
      <LandingNavbar onEnter={onEnter} />
      <main>
        <LandingHero onEnter={onEnter} />
        <LandingAbout />
        <LandingNews />
        <LandingGallery />
      </main>
      <LandingFooter onEnter={onEnter} />
    </div>
  );
}
