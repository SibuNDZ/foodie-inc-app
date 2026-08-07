import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HeroSearch } from '../hero-search/hero-search';
import { CuisineStrip } from '../cuisine-strip/cuisine-strip';
import { HomePromo } from '../home-promo/home-promo';
import { AppDownload } from '../app-download/app-download';
import { LogoMark } from '../../layout/logo-mark/logo-mark';
import { AuthPrompt } from '../../auth/auth-prompt/auth-prompt';

/**
 * The marketing destinations, which live in the hero on this route and in the
 * header everywhere else. Same four links, same order, one place each.
 */
export const HERO_PILLS: ReadonlyArray<{ path: string; label: string }> = [
  { path: '/restaurants', label: 'Explore' },
  { path: '/corporate-orders', label: 'Corporate Orders' },
  { path: '/become-a-driver', label: 'Become a Driver' },
  { path: '/partner-with-us', label: 'Partner with Us' }
];

/**
 * Marketing landing page at `/`.
 *
 * Signed-out visitors get the sign-up prompt; the restaurant listing itself lives
 * at `/restaurants`, which is where the prompt sends people once they have an
 * account. The listing route stays publicly reachable so deep links and crawlers
 * still work.
 */
@Component({
  selector: 'app-landing',
  imports: [
    RouterLink, RouterLinkActive,
    HeroSearch, CuisineStrip, HomePromo, AppDownload, LogoMark, AuthPrompt
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  protected readonly pills = HERO_PILLS;
}
