import { Dish } from '../../../models';
import { filterRestaurantDishes, RestaurantDetailFilterState } from './restaurant-detail';

describe('filterRestaurantDishes', () => {
  const dishes: Dish[] = [
    {
      id: 1,
      name: 'Spicy Ramen',
      description: 'Noodles with chili oil',
      price: 14,
      restaurantId: 42,
      categoryName: 'Noodles',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      preparationTime: 18,
      spiceLevel: 4
    },
    {
      id: 2,
      name: 'Green Bowl',
      description: 'Vegan salad with grains',
      price: 12,
      restaurantId: 42,
      categoryName: 'Bowls',
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      preparationTime: 10,
      spiceLevel: 0
    },
    {
      id: 3,
      name: 'Sold Out Burger',
      description: 'This should never reappear',
      price: 9,
      restaurantId: 42,
      categoryName: 'Burgers',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: false,
      preparationTime: 14,
      spiceLevel: 0
    }
  ];

  const baseState: RestaurantDetailFilterState = {
    searchQuery: '',
    vegetarianOnly: false,
    veganOnly: false,
    glutenFreeOnly: false,
    selectedCategory: 'all',
    sortMode: 'featured'
  };

  it('keeps unavailable dishes excluded while filtering and sorting', () => {
    const result = filterRestaurantDishes(dishes, {
      ...baseState,
      searchQuery: 'green',
      selectedCategory: 'Bowls',
      vegetarianOnly: true,
      veganOnly: true,
      glutenFreeOnly: true,
      sortMode: 'price-desc'
    });

    expect(result.map((dish) => dish.id)).toEqual([2]);
    expect(result.some((dish) => dish.id === 3)).toBeFalse();
  });

  it('sorts by price when requested', () => {
    const result = filterRestaurantDishes(dishes, {
      ...baseState,
      sortMode: 'price-asc'
    });

    expect(result.map((dish) => dish.id)).toEqual([2, 1]);
  });

  it('sorts by preparation time in featured mode', () => {
    const result = filterRestaurantDishes(dishes, baseState);

    expect(result.map((dish) => dish.id)).toEqual([2, 1]);
  });
});