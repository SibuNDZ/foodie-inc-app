import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserRole } from '../../../models';
import { AuthService } from '../../../services/auth';
import { CartService } from '../../../services/cart';
import { LogoMark } from '../logo-mark/logo-mark';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoMark],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly UserRole = UserRole;

  /** Drives the collapsed mobile menu. Always closed on the server. */
  protected readonly menuOpen = signal(false);

  constructor() {
    // A completed navigation should never leave the mobile panel covering the page.
    inject(Router)
      .events.pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
