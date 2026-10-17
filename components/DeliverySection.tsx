import Link from 'next/link';

export default function DeliverySection({ id }: { id?: string }) {
  return (
    <section id={id} style={{ 
      padding: 'var(--spacing-xl) 0', 
      backgroundColor: '#fdfafb',
      borderTop: '1px solid #f0e6eb',
      scrollMarginTop: '80px'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '3rem', 
          color: 'var(--accent-color)', 
          marginBottom: 'var(--spacing-sm)' 
        }}>
          FOOD DELIVERY
        </h2>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#555', 
          maxWidth: '600px', 
          margin: '0 auto var(--spacing-md)' 
        }}>
          Enjoy your Arra Cafe favourites from the comfort of your home.
        </p>
        <Link href="/delivery" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          ORDER NOW
        </Link>
      </div>
    </section>
  );
}
