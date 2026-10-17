import Link from 'next/link';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      {/* Background image container for later use */}
      <div className="hero-bg"></div>
      <div className="hero-overlay"></div>
      
      <div className="container hero-container">
        <div className="hero-content">
          <span className="hero-eyebrow">WELCOME TO ARRA</span>
          <h1 className="hero-title">SOUTH TIFFIN ADDA</h1>
          <p className="hero-description">
            Good food, warm moments, and a place to feel at home.
          </p>
          <div className="hero-actions">
            <Link href="#booking" className="btn btn-primary">BOOK A TABLE</Link>
            <Link href="/menu" className="btn btn-outline" style={{ borderColor: 'var(--white)', color: 'var(--white)' }}>VIEW MENU</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
