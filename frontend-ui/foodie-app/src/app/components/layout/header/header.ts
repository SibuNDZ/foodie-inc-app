import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
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

  private readonly host = inject(ElementRef<HTMLElement>);

  /** Drives the collapsed mobile menu. Always closed on the server. */
  protected readonly menuOpen = signal(false);

  /** Drives the authenticated account dropdown. */
  protected readonly userMenuOpen = signal(false);

  /** Initials for the avatar, derived from the username. */
  protected readonly initials = computed(() => {
    const name = this.authService.currentUser()?.username ?? '';
    const parts = name.split(/[.\s_-]+/).filter(Boolean);
    const letters = parts.length > 1
      ? parts[0][0] + parts[1][0]
      : name.slice(0, 2);
    return letters.toUpperCase();
  });

  constructor() {
    // A completed navigation should never leave a panel covering the page.
    inject(Router)
      .events.pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.closeAll());
  }

  /** Clicking anywhere outside the header dismisses the account dropdown. */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) {
      return;
    }
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.userMenuOpen.set(false);
  }

  protected toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeAll(): void {
    this.menuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.closeAll();
    this.authService.logout();
  }
}
