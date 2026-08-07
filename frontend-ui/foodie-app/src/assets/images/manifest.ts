/**
 * Curated photography for Foodie Inc.
 *
 * Source: Unsplash. The Unsplash Licence grants free commercial use with no
 * permission required; attribution is appreciated but not obligatory. Photos are
 * served from the Unsplash CDN rather than committed, so the repo stays light and
 * images arrive already resized and format-negotiated.
 *
 * Every URL below was checked twice before landing here:
 *   1. `curl -sI` returned HTTP 200 with content-type image/jpeg.
 *   2. The image was downloaded and viewed, to confirm it actually depicts what
 *      the key claims. That second pass caught a "courier" photo that was a pug
 *      in a t-shirt, and two "Thai" photos that were Japanese ramen.
 *
 * Re-verify with: npm run verify:images
 */

export type ImageKey =
  | 'burgers' | 'pizza' | 'sushi' | 'thai' | 'chinese' | 'brunch' | 'dessert'
  | 'grocery' | 'chef' | 'courier' | 'office' | 'hero';

export interface CuratedImage {
  /** Unsplash photo id, the stable part of the CDN path. */
  readonly id: string;
  /** What the photo actually shows, used as alt text where no better copy exists. */
  readonly alt: string;
}

const CDN = 'https://images.unsplash.com/';

/**
 * Builds a CDN URL at the requested width.
 * `auto=format` lets Unsplash serve AVIF/WebP to browsers that accept them.
 */
export function imageUrl(image: CuratedImage, width = 800): string {
  return `${CDN}${image.id}?w=${width}&q=80&auto=format&fit=crop`;
}

export const IMAGES: Readonly<Record<ImageKey, readonly CuratedImage[]>> = {
  burgers: [
    { id: 'photo-1568901346375-23c9450c58cd', alt: 'Double cheeseburger with lettuce and tomato on a wooden board' },
    { id: 'photo-1571091718767-18b5b1457add', alt: 'Sesame-bun beef burger with melted cheese and crisp lettuce' },
  ],
  pizza: [
    { id: 'photo-1513104890138-7c749659a591', alt: 'Sliced pepperoni pizza with cherry tomatoes and rosemary' },
    { id: 'photo-1565299624946-b28f40a0ae38', alt: 'Wood-fired pizza topped with herbs on a serving board' },
  ],
  sushi: [
    { id: 'photo-1579871494447-9811cf80d66c', alt: 'Platter of assorted sushi rolls and nigiri' },
    { id: 'photo-1553621042-f6e147245754', alt: 'Salmon and avocado sushi rolls on a dark wooden board' },
  ],
  thai: [
    { id: 'photo-1455619452474-d2be8b1e70cd', alt: 'Thai red curry with basil and chilli in a white bowl' },
    { id: 'photo-1562565652-a0d8f0c59eb4', alt: 'Thai spread of papaya salad, soup and grilled meat' },
  ],
  chinese: [
    { id: 'photo-1585032226651-759b368d7246', alt: 'Steamed dumplings in a bamboo basket' },
    { id: 'photo-1563245372-f21724e3856d', alt: 'Stir-fried noodles on a wooden plate with chopsticks' },
  ],
  brunch: [
    { id: 'photo-1533089860892-a7c6f0a88666', alt: 'Fried egg on toast with avocado' },
    { id: 'photo-1525351484163-7529414344d8', alt: 'Fried eggs, bacon and toast on a white plate' },
  ],
  dessert: [
    { id: 'photo-1551024506-0bccd828d307', alt: 'Strawberry panna cotta in small glass jars' },
    { id: 'photo-1488477181946-6428a0291777', alt: 'Brownie sundae with ice cream and caramel sauce' },
  ],
  grocery: [
    { id: 'photo-1542838132-92c53300491e', alt: 'Fresh produce shelves in a grocery store' },
    { id: 'photo-1573246123716-6b1782bfc499', alt: 'Colourful fruit and vegetables arranged on a counter' },
  ],
  chef: [
    { id: 'photo-1577219491135-ce391730fb2c', alt: 'Chef plating a dish under warm kitchen heat lamps' },
    { id: 'photo-1556910103-1c02745aae4d', alt: 'Two cooks preparing food together in an open kitchen' },
  ],
  courier: [
    { id: 'photo-1591768575198-88dac53fbd0a', alt: 'Cycle courier with an insulated delivery backpack on a city street' },
  ],
  office: [
    { id: 'photo-1543269865-cbf427effbad', alt: 'Colleagues sitting around a table with coffee' },
  ],
  hero: [
    { id: 'photo-1504674900247-0877df9cc836', alt: 'Overhead spread of plated dishes on a wooden table' },
    { id: 'photo-1414235077428-338989a2e8c0', alt: 'Plated dish on a restaurant table set for dinner' },
  ],
};

/** First image for a key, which is the curated primary choice. */
export function primaryImage(key: ImageKey): CuratedImage {
  return IMAGES[key][0];
}

/** Flat list, used by the URL verification script. */
export const ALL_IMAGES: readonly CuratedImage[] =
  Object.values(IMAGES).flat();
