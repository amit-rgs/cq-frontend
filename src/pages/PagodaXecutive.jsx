// src/pages/hotel/PagodaXecutive.jsx
import { Helmet } from 'react-helmet-async';

function PagodaXecutive() {
  return (
    <>
      <Helmet>
        <title>Pagoda Xecutive - Book Hotel in Lote, Chiplun | Customer Quest</title>
        <meta
          name="description"
          content="Book Pagoda Xecutive hotel in Lote, Taluka Khed Chiplun area. Comfortable rooms, free WiFi. Call +91 86987 32336 or email pagodainform@gmail.com. Best price only on Customer Quest."
        />
      </Helmet>

      <h1>Pagoda Xecutive</h1>
      <p>Address: Taluka Khed Chiplun Area, Lote, Maharashtra, 415722</p>
      <p>
        Phone: <a href="tel:+918698732336">+91 86987 32336</a>
      </p>
      <p>
        Email: <a href="mailto:pagodainform@gmail.com">pagodainform@gmail.com</a>
      </p>

      <button>Book Now</button>
    </>
  );
}

export default PagodaXecutive;
