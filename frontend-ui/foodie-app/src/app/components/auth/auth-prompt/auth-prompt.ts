import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

/** Where a visitor lands once they have an account. */
export const POST_AUTH_DESTINATION = '/restaurants';

/**
 * Sign-up / sign-in prompt shown to signed-out visitors on the landing page.
 *
 * Rendered only after hydration: auth state lives in localStorage, so during SSR
 * every visitor looks signed out and the dialog would be baked into the server
 * HTML and flash for signed-in users.
 */
@Component({
  selector: 'app-auth-prompt',
  templateUrl: './auth-prompt.html',
  styleUrl: './auth-prompt.scss'
})
export class AuthPrompt {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly visible = signal(false);

  /** The element focus returns to when the dialog closes. */
  private previouslyFocused: HTMLElement | null = null;
  private hasFocused = false;

  constructor() {
    afterNextRender(() => {
      if (this.authService.isAuthenticated()) {
        return;
      }
      this.previouslyFocused = document.activeElement as HTMLElement | null;
      this.visible.set(true);
    });

    // The viewChild signal only resolves once the dialog is actually in the DOM,
    // so this is the first moment focus can safely move into it.
    effect(() => {
      const host = this.dialog()?.nativeElement;
      if (!host || !this.visible() || this.hasFocused) {
        return;
      }
      this.hasFocused = true;
      this.focusFirst();
    });
  }

  protected signUp(): void {
    this.close();
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: POST_AUTH_DESTINATION }
    });
  }

  protected signIn(): void {
    this.close();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: POST_AUTH_DESTINATION }
    });
  }

  protected dismiss(): void {
    this.close();
    this.previouslyFocused?.focus?.();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismiss();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    // Keep focus inside the dialog while it is open.
    const focusables = this.focusable();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private close(): void {
    this.visible.set(false);
  }

  private focusable(): HTMLElement[] {
    const host = this.dialog()?.nativeElement;
    if (!host) {
      return [];
    }
    return Array.from(
      host.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')
    ).filter(el => !el.hasAttribute('disabled'));
  }

  private focusFirst(): void {
    this.focusable()[0]?.focus();
  }
}
