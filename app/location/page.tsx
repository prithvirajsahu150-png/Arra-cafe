import Navbar from '../../components/Navbar';
import './Location.css';

export default function LocationPage() {
  return (
    <>
      <Navbar />
      <main className="location-main">
        <section className="location-section">
          <div className="container">
            <div className="location-card">
              <h1 className="location-title">Visit Us</h1>
              <div className="location-content">
                <div className="location-address">
                  <h2>Arra Cafe</h2>
                  <p>Ground Floor, New Bus Stand Road,</p>
                  <p>Manjari Nagar, Brahmapur (Berhampur),</p>
                  <p>Odisha 760001</p>
                </div>
                
                <div className="location-map-placeholder">
                  <p className="map-note">Map destination provided via Google Maps</p>
                  <a 
                    href="https://maps.app.goo.gl/7B5bHZpnUAMyL2bH6" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary"
                    aria-label="Get directions to Arra Cafe on Google Maps"
                  >
                    GET DIRECTIONS
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
