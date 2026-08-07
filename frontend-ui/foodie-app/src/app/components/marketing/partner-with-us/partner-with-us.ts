import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { imageUrl, primaryImage } from '../../../../assets/images/manifest';

/**
 * Restaurant pitch page. The CTA drops into the existing self-registration flow
 * at /register/restaurant, which creates the owner account and a PENDING_REVIEW
 * restaurant for an admin to approve.
 */
@Component({
  selector: 'app-partner-with-us',
  imports: [RouterLink, SmartImage],
  templateUrl: './partner-with-us.html',
  styleUrl: './partner-with-us.scss'
})
export class PartnerWithUs {
  private static readonly HERO = primaryImage('chef');
  protected readonly heroPhoto = imageUrl(PartnerWithUs.HERO, 900);
  protected readonly heroAlt = PartnerWithUs.HERO.alt;
}
