import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { imageUrl, primaryImage } from '../../../../assets/images/manifest';

@Component({
  selector: 'app-about-us',
  imports: [RouterLink, SmartImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs {
  private static readonly HERO = primaryImage('hero');
  protected readonly heroPhoto = imageUrl(AboutUs.HERO, 900);
  protected readonly heroAlt = AboutUs.HERO.alt;
}
