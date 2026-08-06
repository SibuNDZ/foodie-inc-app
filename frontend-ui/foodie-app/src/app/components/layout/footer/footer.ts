import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMark } from '../logo-mark/logo-mark';

export interface SocialLink {
  readonly icon: string;
  readonly label: string;
  readonly url: string;
}

/** Foodie Inc is @foodieincza on every platform. */
export const SOCIAL_HANDLE = 'foodieincza';

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { icon: 'fa-brands fa-instagram', label: 'Instagram', url: `https://www.instagram.com/${SOCIAL_HANDLE}` },
  { icon: 'fa-brands fa-facebook', label: 'Facebook', url: `https://www.facebook.com/${SOCIAL_HANDLE}` },
  { icon: 'fa-brands fa-x-twitter', label: 'X', url: `https://x.com/${SOCIAL_HANDLE}` },
  { icon: 'fa-brands fa-tiktok', label: 'TikTok', url: `https://www.tiktok.com/@${SOCIAL_HANDLE}` },
  { icon: 'fa-brands fa-youtube', label: 'YouTube', url: `https://www.youtube.com/@${SOCIAL_HANDLE}` }
];

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  protected readonly socials = SOCIAL_LINKS;
  protected readonly year = new Date().getFullYear();
}
