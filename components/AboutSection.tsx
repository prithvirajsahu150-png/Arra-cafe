import Link from 'next/link';
import './AboutSection.css';

export default function AboutSection({ id }: { id?: string }) {
  return (
    <section id={id} className="about-section" style={{ scrollMarginTop: '80px' }}>
      <div className="container">
        <div className="about-layout">
          
          <div className="about-content">
            <div className="section-header">
              <span className="section-eyebrow">ABOUT ARRA CAFE</span>
              <h2 className="section-title">SOUTH TIFFIN ADDA</h2>
            </div>
            
            <p className="about-intro">
              Arra Cafe is a place to enjoy good food, warm moments, and a comfortable cafe experience.
            </p>

            <div className="experience-grid">
              <div className="experience-card">
                <h4 className="experience-title">GOOD FOOD</h4>
                <p>Freshly prepared dishes and cafe favourites.</p>
              </div>
              <div className="experience-card">
                <h4 className="experience-title">WARM MOMENTS</h4>
                <p>A comfortable place to spend time with friends and family.</p>
              </div>
              <div className="experience-card">
                <h4 className="experience-title">SPECIAL OCCASIONS</h4>
                <p>A welcoming space for birthdays, celebrations and special gatherings.</p>
              </div>
              <div className="experience-card">
                <h4 className="experience-title">FOOD DELIVERY</h4>
                <p>Enjoy your Arra Cafe favourites from home.</p>
              </div>
            </div>
          </div>

          <div className="about-sidebar">
            <div className="sidebar-card instagram-card">
              <h3>FOLLOW ARRA CAFE</h3>
              <p>See what's happening at Arra Cafe and discover our latest food, moments and updates.</p>
              <div className="ig-handle">@arra_cafe</div>
              <a 
                href="https://www.instagram.com/arra_cafe?utm_source=ig_web_button_share_sheet&cplk=ZDNlZDc0MzIxNw==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary btn-block ig-btn"
              >
                FOLLOW US ON INSTAGRAM
              </a>
            </div>

            <div className="sidebar-card location-card">
              <h3>OUR LOCATION</h3>
              <address>
                <strong>Arra Cafe</strong><br />
                Ground Floor, New Bus Stand Road,<br />
                Manjari Nagar, Brahmapur (Berhampur),<br />
                Odisha 760001
              </address>
              
              <a 
                href="https://maps.app.goo.gl/7B5bHZpnUAMyL2bH6" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-block map-btn"
              >
                VIEW ON GOOGLE MAPS
              </a>
            </div>
            
            <div className="action-buttons">
              <Link href="/menu" className="btn btn-outline btn-block">VIEW MENU</Link>
              <Link href="/#booking" className="btn btn-outline btn-block" style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}>BOOK A TABLE</Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
