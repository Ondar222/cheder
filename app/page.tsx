import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Prices from '@/components/Prices';
import Gallery from '@/components/Gallery';
import News from '@/components/News';
import FAQ from '@/components/FAQ';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import ScrollAnimations from '@/components/ScrollAnimations';

export default function Home() {
  return (
    <main className="relative">
      <ScrollAnimations />
      <Header />
      <Hero />
      <About />
      <Services />
      <Prices />
      <Gallery />
      <News />
      <FAQ />
      <Contacts />
      <Footer />
    </main>
  );
}