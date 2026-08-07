import { Signal, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

/** The landing route, ignoring any query string or fragment hanging off it. */
export function isHomeUrl(url: string): boolean {
  return url.split(/[?#]/)[0].replace(/\/+$/, '') === '';
}

/**
 * True while the router is on `/`.
 *
 * Home differs from every other route in two ways that are decided by layout
 * rather than by content: the shell lets it run the full width of the window,
 * and the header drops the marketing links because the hero states them. Both
 * read this, so the two cannot drift apart.
 *
 * Seeded from the current URL rather than from the first NavigationEnd, so the
 * server renders the same shell the browser will. Call from an injection
 * context.
 */
export function onHome(): Signal<boolean> {
  const router = inject(Router);
  const home = signal(isHomeUrl(router.url));

  router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    )
    .subscribe(event => home.set(isHomeUrl(event.urlAfterRedirects)));

  return home.asReadonly();
}
