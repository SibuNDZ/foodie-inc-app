import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../../models';
import { AuthService } from '../../../services/auth';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly UserRole = UserRole;

  protected logout(): void {
    this.authService.logout();
  }
}
