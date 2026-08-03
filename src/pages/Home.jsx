import React from 'react';
import Hero from '../components/Hero';
import StayCategories from '../components/StayCategories';
import TopDeals from '../components/TopDeals';
import Footer from '../components/Footer';
import HeroBannerBg from '../components/HeroBannerBg';

const Home = () => {
  return (
    <div>
      <HeroBannerBg />

      <Hero />

      <StayCategories />
      {/* <TopDeals /> */}
      <Footer />
    </div>
  );
};
export default Home;
