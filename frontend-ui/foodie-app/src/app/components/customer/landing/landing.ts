import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSearch } from '../hero-search/hero-search';
import { CategoryCarousel } from '../category-carousel/category-carousel';
import { HomePromo } from '../home-promo/home-promo';
import { AppDownload } from '../app-download/app-download';
import { LogoMark } from '../../layout/logo-mark/logo-mark';
import { AuthPrompt } from '../../auth/auth-prompt/auth-prompt';

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
  imports: [HeroSearch, CategoryCarousel, HomePromo, AppDownload, LogoMark, AuthPrompt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {}
