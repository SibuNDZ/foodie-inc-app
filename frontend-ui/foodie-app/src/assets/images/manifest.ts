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
  | 'grocery' | 'chef' | 'courier' | 'office' | 'hero'
  | 'fastFood' | 'iceCream' | 'wings' | 'healthy' | 'indian' | 'mexican'
  | 'gifts' | 'greek' | 'coffee' | 'bubbleTea' | 'korean' | 'smoothies'
  | 'asian' | 'poke' | 'halal' | 'vietnamese' | 'italian' | 'seafood'
  | 'soup' | 'comfortFood' | 'bbq' | 'vegan' | 'streetFood' | 'japanese'
  | 'sandwiches' | 'caribbean';

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
    { id: 'photo-1579871494447-9811cf80d66c', alt: 'Salmon and avocado sushi rolls on a dark wooden board' },
    { id: 'photo-1553621042-f6e147245754', alt: 'Platter of assorted sushi rolls and nigiri' },
  ],
  thai: [
    { id: 'photo-1455619452474-d2be8b1e70cd', alt: 'Thai red curry with basil and chilli in a white bowl' },
    { id: 'photo-1562565652-a0d8f0c59eb4', alt: 'Thai spread of papaya salad, soup and grilled meat' },
  ],
  chinese: [
    { id: 'photo-1585032226651-759b368d7246', alt: 'Stir-fried noodles on a wooden plate with chopsticks' },
    { id: 'photo-1563245372-f21724e3856d', alt: 'Steamed dumplings in a bamboo basket' },
  ],
  brunch: [
    { id: 'photo-1533089860892-a7c6f0a88666', alt: 'Fried eggs, bacon and toast on a white plate' },
    { id: 'photo-1525351484163-7529414344d8', alt: 'Fried egg on avocado toast' },
  ],
  dessert: [
    { id: 'photo-1551024506-0bccd828d307', alt: 'Brownie sundae with ice cream and caramel sauce' },
    { id: 'photo-1488477181946-6428a0291777', alt: 'Strawberry panna cotta in small glass jars' },
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
    { id: 'photo-1526367790999-0150786686a2', alt: 'Cycle courier with an insulated delivery backpack on a city street' },
  ],
  office: [
    { id: 'photo-1543269865-cbf427effbad', alt: 'Colleagues sitting around a table with coffee' },
  ],
  hero: [
    { id: 'photo-1504674900247-0877df9cc836', alt: 'Overhead spread of plated dishes on a wooden table' },
    { id: 'photo-1414235077428-338989a2e8c0', alt: 'Plated dish on a restaurant table set for dinner' },
  ],

  /* The rest of the cuisine menu. Same two-pass check as above: every id came
     from an Unsplash search response rather than from memory, and every photo
     was looked at before it landed here. That second pass is why "Wings" is not
     the wings-with-half-a-grapefruit shot and "Poke" is not a plain salad. */
  fastFood: [
    { id: 'photo-1518013431117-eb1465fa5752', alt: 'Golden French fries with ketchup' },
  ],
  iceCream: [
    { id: 'photo-1497034825429-c343d7c6a68f', alt: 'Scoop of strawberry ice cream in a waffle cone' },
  ],
  wings: [
    { id: 'photo-1567620832903-9fc6debc209f', alt: 'Glazed chicken wings on a serving plate' },
  ],
  healthy: [
    { id: 'photo-1512621776951-a57141f2eefd', alt: 'Salad bowl of greens, chickpeas, tomato and avocado' },
  ],
  indian: [
    { id: 'photo-1585937421612-70a008356fbe', alt: 'Indian curries served in steel bowls' },
  ],
  mexican: [
    { id: 'photo-1565299585323-38d6b0865b47', alt: 'Soft tacos filled with meat, salad and lime' },
  ],
  gifts: [
    { id: 'photo-1508899203029-1c9eb493c9bd', alt: 'Gift hamper of food and drink in a wicker basket' },
  ],
  greek: [
    { id: 'photo-1745126009946-1b35b1a16fec', alt: 'Greek gyros wrap filled with meat and chips' },
  ],
  coffee: [
    { id: 'photo-1503481766315-7a586b20f66d', alt: 'Cappuccino with latte art in a white cup' },
  ],
  bubbleTea: [
    { id: 'photo-1747016804753-866c3ed6b3b7', alt: 'Bubble teas with tapioca pearls and paper straws' },
  ],
  korean: [
    { id: 'photo-1741295017668-c8132acd6fc0', alt: 'Korean bibimbap with vegetables and side dishes' },
  ],
  smoothies: [
    { id: 'photo-1622597468620-656aa1f981ea', alt: 'Berry smoothies in glasses with fresh fruit' },
  ],
  asian: [
    { id: 'photo-1631709497146-a239ef373cf1', alt: 'Bowl of Asian noodle soup with chopsticks' },
  ],
  poke: [
    { id: 'photo-1546069901-ba9599a7e63c', alt: 'Poke bowl of rice, greens and vegetables' },
  ],
  halal: [
    { id: 'photo-1529006557810-274b9b2fc783', alt: 'Beef shawarma wrap sliced open' },
  ],
  vietnamese: [
    { id: 'photo-1582878826629-29b7ad1cdc43', alt: 'Vietnamese pho with fresh herbs in a white bowl' },
  ],
  italian: [
    { id: 'photo-1516100882582-96c3a05fe590', alt: 'Spaghetti in tomato sauce on a white plate' },
  ],
  seafood: [
    { id: 'photo-1691201659377-978b28daa417', alt: 'Plate of prawns with lemon and dipping sauce' },
  ],
  soup: [
    { id: 'photo-1613844237701-8f3664fc2eff', alt: 'Bowl of soup garnished with fresh herbs' },
  ],
  comfortFood: [
    { id: 'photo-1667499989723-c4ab9549d63c', alt: 'Macaroni cheese in a cast-iron pot' },
  ],
  bbq: [
    { id: 'photo-1544025162-d76694265947', alt: 'Barbecue ribs on a wooden board with tomatoes and potatoes' },
  ],
  vegan: [
    { id: 'photo-1593967858208-67ddb5b4c406', alt: 'Grilled asparagus and vegetables plated on white' },
  ],
  streetFood: [
    { id: 'photo-1552912470-ee2e96439539', alt: 'Street food vendor cooking at a market stall' },
  ],
  japanese: [
    { id: 'photo-1569718212165-3a8278d5f624', alt: 'Bowl of ramen with a soft-boiled egg' },
  ],
  sandwiches: [
    { id: 'photo-1553909489-cd47e0907980', alt: 'Club sandwich cut in half' },
  ],
  caribbean: [
    { id: 'photo-1772693471187-6e7d364f99ee', alt: 'Grilled chicken with rice and stir-fried vegetables' },
  ],
};

/** First image for a key, which is the curated primary choice. */
export function primaryImage(key: ImageKey): CuratedImage {
  return IMAGES[key][0];
}

/** Flat list, used by the URL verification script. */
export const ALL_IMAGES: readonly CuratedImage[] =
  Object.values(IMAGES).flat();
