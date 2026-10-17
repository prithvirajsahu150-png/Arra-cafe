import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BookingSection from '../components/BookingSection';
import DeliverySection from '../components/DeliverySection';
import OffersSection from '../components/OffersSection';
import AboutSection from '../components/AboutSection';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutSection id="about" />
        <OffersSection id="offers" />
        <BookingSection id="booking" />
        <DeliverySection id="delivery" />
      </main>
    </>
  );
}
