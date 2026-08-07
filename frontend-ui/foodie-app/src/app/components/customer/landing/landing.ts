import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSearch } from '../hero-search/hero-search';
import { CuisineStrip } from '../cuisine-strip/cuisine-strip';
import { HomePromo } from '../home-promo/home-promo';
import { AppDownload } from '../app-download/app-download';
import { LogoMark } from '../../layout/logo-mark/logo-mark';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { AuthPrompt } from '../../auth/auth-prompt/auth-prompt';
import { imageUrl, primaryImage } from '../../../../assets/images/manifest';

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
    HeroSearch, CuisineStrip, HomePromo, AppDownload,
    LogoMark, SmartImage, AuthPrompt
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  /** Flanking hero artwork. Decorative, so both render with empty alt. */
  protected readonly groceryPhoto = imageUrl(primaryImage('grocery'), 600);
  protected readonly burgerPhoto = imageUrl(primaryImage('burgers'), 600);
}
