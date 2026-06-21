import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { UserRole } from '../models';
import { ToastrService } from 'ngx-toastr';

export const restaurantOwnerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.hasAnyRole([UserRole.RESTAURANT_OWNER, UserRole.ADMIN])) {
    return true;
  }

  toastr.warning('You do not have access to the restaurant owner portal.');
  router.navigate(['/']);
  return false;
};
