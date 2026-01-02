// lib/listingImages.js
// Adjust COUNT to match how many images you have in /public/listing (1.png..N.png)
export const COUNT = 12;

export const listingImages = Array.from({ length: COUNT }, (_, i) => ({
  src: `/listing/${i + 1}.png`,
  alt: `Peaceful Corner photo ${i + 1}`,
}));
