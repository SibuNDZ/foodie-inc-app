import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { imageUrl, primaryImage } from '../../../../assets/images/manifest';

/** Where speculative applications go. Replace with a real careers inbox or ATS link. */
export const CAREERS_ENQUIRY_ADDRESS = 'careers@foodieapp.co.za';

@Component({
  selector: 'app-careers',
  imports: [RouterLink, SmartImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './careers.html',
  styleUrl: './careers.scss'
})
export class Careers {
  private static readonly HERO = primaryImage('chef');
  protected readonly heroPhoto = imageUrl(Careers.HERO, 900);
  protected readonly heroAlt = Careers.HERO.alt;

  protected readonly careersAddress = CAREERS_ENQUIRY_ADDRESS;
  protected readonly mailto = `mailto:${CAREERS_ENQUIRY_ADDRESS}?subject=${encodeURIComponent('Speculative application')}`;
}
