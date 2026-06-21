export interface Dish {
  id: number;
  name: string;
  description?: string;
  price: number;
  restaurantId: number;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  preparationTime?: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel?: number;
  calories?: number;
  isAvailable: boolean;
}

export interface DishCategory {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive: boolean;
}

export interface DishFilter {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  maxPrice?: number;
}
