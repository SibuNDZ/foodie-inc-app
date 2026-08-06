import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { restaurantOwnerGuard } from './guards/restaurant-owner-guard';
import { deliveryPersonGuard } from './guards/delivery-person-guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./components/customer/landing/landing').then(m => m.Landing)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then(m => m.Register)
  },
  {
    path: 'register/restaurant',
    loadComponent: () => import('./components/auth/register-restaurant/register-restaurant').then(m => m.RegisterRestaurant)
  },
  {
    path: 'restaurants',
    loadComponent: () => import('./components/customer/restaurant-list/restaurant-list').then(m => m.RestaurantList)
  },
  {
    path: 'restaurant/:id',
    loadComponent: () => import('./components/customer/restaurant-detail/restaurant-detail').then(m => m.RestaurantDetail)
  },

  // Marketing landing pages
  {
    path: 'corporate-orders',
    loadComponent: () => import('./components/marketing/corporate-orders/corporate-orders').then(m => m.CorporateOrders)
  },
  {
    path: 'become-a-driver',
    loadComponent: () => import('./components/marketing/become-a-driver/become-a-driver').then(m => m.BecomeADriver)
  },
  {
    path: 'partner-with-us',
    loadComponent: () => import('./components/marketing/partner-with-us/partner-with-us').then(m => m.PartnerWithUs)
  },
  {
    path: 'about-us',
    loadComponent: () => import('./components/marketing/about-us/about-us').then(m => m.AboutUs)
  },
  {
    path: 'careers',
    loadComponent: () => import('./components/marketing/careers/careers').then(m => m.Careers)
  },

  // Customer routes (protected)
  {
    path: 'cart',
    loadComponent: () => import('./components/customer/cart/cart').then(m => m.Cart),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/customer/checkout/checkout').then(m => m.Checkout),
    canActivate: [authGuard]
  },
  {
    path: 'order/success',
    loadComponent: () => import('./components/customer/order-success/order-success').then(m => m.OrderSuccess)
  },
  {
    path: 'order/cancelled',
    loadComponent: () => import('./components/customer/order-cancelled/order-cancelled').then(m => m.OrderCancelled)
  },
  {
    path: 'orders',
    loadComponent: () => import('./components/customer/order-history/order-history').then(m => m.OrderHistory),
    canActivate: [authGuard]
  },
  {
    path: 'order/:id',
    loadComponent: () => import('./components/customer/order-tracking/order-tracking').then(m => m.OrderTracking),
    canActivate: [authGuard]
  },

  // Driver routes
  {
    path: 'driver/deliveries',
    loadComponent: () => import('./components/driver/delivery-worklist/delivery-worklist').then(m => m.DeliveryWorklist),
    canActivate: [deliveryPersonGuard]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'restaurants',
        loadComponent: () => import('./components/admin/restaurant-management/restaurant-management').then(m => m.RestaurantManagement)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/admin/order-management/order-management').then(m => m.OrderManagement)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/admin/user-management/user-management').then(m => m.UserManagement)
      },
      {
        path: 'restaurants/pending',
        loadComponent: () => import('./components/admin/pending-restaurants/pending-restaurants').then(m => m.PendingRestaurants)
      }
    ]
  },

  // Restaurant owner routes
  {
    path: 'owner/dashboard',
    canActivate: [restaurantOwnerGuard],
    loadComponent: () => import('./components/restaurant/owner-dashboard/owner-dashboard').then(m => m.OwnerDashboard)
  },
  // Legacy owner sub-routes kept for backward-compat (admin can still reach them)
  {
    path: 'my-restaurant',
    canActivate: [restaurantOwnerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/restaurant/restaurant-dashboard/restaurant-dashboard').then(m => m.RestaurantDashboard)
      },
      {
        path: 'dishes',
        loadComponent: () => import('./components/restaurant/dish-management/dish-management').then(m => m.DishManagement)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/restaurant/order-management/order-management').then(m => m.OrderManagement)
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
