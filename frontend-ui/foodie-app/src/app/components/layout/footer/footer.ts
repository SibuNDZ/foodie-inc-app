import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMark } from '../logo-mark/logo-mark';

export interface SocialLink {
  readonly icon: string;
  readonly label: string;
  readonly url: string;
}

/**
 * PLACEHOLDERS: these point at each platform's home page, not at Foodie Inc
 * accounts, because the real handles are not known here. Replace each url with
 * the actual profile before launch rather than guessing a handle, which risks
 * sending customers to someone else's account.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { icon: 'fa-brands fa-instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
  { icon: 'fa-brands fa-facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
  { icon: 'fa-brands fa-x-twitter', label: 'X', url: 'https://x.com/' },
  { icon: 'fa-brands fa-tiktok', label: 'TikTok', url: 'https://www.tiktok.com/' },
  { icon: 'fa-brands fa-youtube', label: 'YouTube', url: 'https://www.youtube.com/' }
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
