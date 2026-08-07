import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { imageUrl, primaryImage } from '../../../../assets/images/manifest';

/**
 * Courier pitch page.
 *
 * The CTA lands on the standard sign-up. The API hardcodes new accounts to
 * CUSTOMER, so there is deliberately no role query param here: courier access is
 * granted by an admin after sign-up, and the copy says so rather than implying a
 * self-service driver account that the backend does not support.
 */
@Component({
  selector: 'app-become-a-driver',
  imports: [RouterLink, SmartImage],
  templateUrl: './become-a-driver.html',
  styleUrl: './become-a-driver.scss'
})
export class BecomeADriver {
  private static readonly HERO = primaryImage('courier');
  protected readonly heroPhoto = imageUrl(BecomeADriver.HERO, 900);
  protected readonly heroAlt = BecomeADriver.HERO.alt;
}
