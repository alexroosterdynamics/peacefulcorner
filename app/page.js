"use client"
import React, { useState } from 'react';
import { X, MapPin, Home, Users, Calendar, Star, ChevronLeft, ChevronRight, Wifi, Tv, Coffee, Wind, Snowflake, Utensils, Waves, Car, Dumbbell, ShieldCheck } from 'lucide-react';

// Mock data - replace with your actual data
const listingData = {
  title: "Peaceful Corner",
  tagline: "A calm, bright apartment",
  description: "A beautiful apartment designed for comfort, light, and quiet moments. Perfect for couples, solo travelers, and anyone seeking a serene retreat in the heart of the city.",
  address: "Strada Sărăriei 202, Etaj 5",
  city: "Iași",
  country: "Romania",
  price: "€45",
  rating: 4.9,
  reviews: 127,
  images: [
    "/listing/1.png",
    "/listing/2.png",
    "/listing/3.png",
    "/listing/4.png",
    "/listing/5.png",
    "/listing/6.png",
    "/listing/7.png"
  ],
  highlights: [
    { icon: Home, title: "50 sqm", subtitle: "Spacious & airy" },
    { icon: Wind, title: "Balcony", subtitle: "Fresh air & views" },
    { icon: Home, title: "5th Floor", subtitle: "Quiet & elevated" },
    { icon: Star, title: "Bright", subtitle: "Natural light" }
  ],
  amenities: [
    { icon: Wifi, name: "Free WiFi", description: "High-speed internet throughout" },
    { icon: Utensils, name: "Full Kitchen", description: "Cook your favorite meals" },
    { icon: Snowflake, name: "Air Conditioning", description: "Climate control" },
    { icon: Waves, name: "Washer", description: "In-unit laundry" },
    { icon: Tv, name: "Smart TV", description: "Netflix, HBO & more" },
    { icon: Coffee, name: "Coffee Maker", description: "Fresh brew anytime" },
    { icon: Wind, name: "Heating", description: "Stay warm in winter" },
    { icon: Home, name: "Workspace", description: "Dedicated work area" },
    { icon: ShieldCheck, name: "Safe & Secure", description: "24/7 building security" },
    { icon: Car, name: "Free Parking", description: "On-site parking available" },
    { icon: Utensils, name: "Cookware", description: "Fully equipped kitchen" },
    { icon: Waves, name: "Hair Dryer", description: "Bathroom essentials" }
  ],
  hosts: [
    {
      name: "Alex",
      role: "Host",
      image: "/hosts/Alex.png",
      bio: "Friendly and responsive, always here to help make your stay perfect."
    },
    {
      name: "Petro",
      role: "Host",
      image: "/hosts/Petro.png",
      bio: "Local expert ready to share the best tips about Iași."
    }
  ]
};

export default function ModernAirbnbListing() {
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % listingData.images.length);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + listingData.images.length) % listingData.images.length);
  };

  return (
    <div className="min-h-screen bg-white" style={{ WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%' }}>
      {/* Glassy Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className={`text-xl sm:text-2xl font-bold transition-colors ${
              scrolled ? 'text-gray-900' : 'text-white drop-shadow-lg'
            }`}>
              {listingData.title}
            </div>
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all shadow-lg">
              Book now
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Hero */}
      <section className="relative h-screen w-full flex items-center justify-center">
        <img 
          src={listingData.images[0]} 
          alt={listingData.title}
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        <div className="relative z-10 text-white text-center px-6 sm:px-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm sm:text-base">{listingData.address}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4">
            {listingData.title}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-6 opacity-90">
            {listingData.tagline}
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-sm sm:text-base mb-8">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{listingData.rating}</span>
              <span className="opacity-75">({listingData.reviews} reviews)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              {listingData.price}<span className="text-lg sm:text-xl font-normal">/night</span>
            </div>
          </div>
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all shadow-2xl">
            Book now
          </button>
        </div>
      </section>

      {/* Borderless Gallery Grid */}
      <section className="w-full">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
          {listingData.images.slice(1).map((img, idx) => (
            <div 
              key={idx}
              className="relative aspect-square cursor-pointer overflow-hidden group"
              onClick={() => {
                setActiveImage(idx + 1);
                setShowGallery(true);
              }}
            >
              <img 
                src={img} 
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-zinc-900">About this place</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {listingData.description}
              </p>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">What this place offers</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {listingData.highlights.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                      <IconComponent className="w-8 h-8 text-rose-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg text-zinc-900">{item.title}</div>
                        <div className="text-gray-600">{item.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">Amenities</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {listingData.amenities.map((amenity, idx) => {
                  const IconComponent = amenity.icon;
                  return (
                    <div key={idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all">
                      <IconComponent className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{amenity.name}</div>
                        <div className="text-sm text-gray-600">{amenity.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hosts */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-zinc-900">Meet your hosts</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {listingData.hosts.map((host, idx) => (
                  <div key={idx} className="flex gap-4 p-6 bg-gray-50 rounded-2xl ">
                    <img 
                      src={host.image} 
                      alt={host.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-lg text-zinc-900">{host.name}</div>
                      <div className="text-sm text-gray-500 mb-2">{host.role}</div>
                      <p className="text-gray-700 text-sm">{host.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold">{listingData.price}</span>
                <span className="text-gray-600">night</span>
              </div>
              
              <button className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-semibold text-lg mb-4 transition-all">
                Reserve
              </button>
              
              <p className="text-center text-sm text-gray-600 mb-6">
                You won't be charged yet
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">{listingData.price} × 5 nights</span>
                  <span className="font-semibold">€225</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cleaning fee</span>
                  <span className="font-semibold">€15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Service fee</span>
                  <span className="font-semibold">€20</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>€260</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - Full Width */}
      <section className="w-full h-96 sm:h-[500px]">
        <iframe
          title="Location Map"
          className="w-full h-full"
          loading="lazy"
          src={`https://www.google.com/maps?q=${encodeURIComponent(listingData.address + ' ' + listingData.city)}&output=embed`}
        />
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold mb-2">{listingData.title}</div>
              <div className="text-gray-400">{listingData.address}, {listingData.city}</div>
            </div>
            <div className="text-gray-400">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>

      {/* Fullscreen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button 
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={prevImage}
            className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <img 
            src={listingData.images[activeImage]}
            alt={`Gallery ${activeImage}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          
          <button 
            onClick={nextImage}
            className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {activeImage + 1} / {listingData.images.length}
          </div>
        </div>
      )}
    </div>
  );
}