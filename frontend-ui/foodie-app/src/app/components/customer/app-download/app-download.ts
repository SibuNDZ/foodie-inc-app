import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SmartImage } from '../../shared/smart-image/smart-image';

/**
 * Store listing URLs.
 *
 * PLACEHOLDERS: Foodie Inc has no published native app yet, so these point at the
 * store search pages. Replace both with the real listing URLs before launch, and
 * swap the icon-and-text badges below for Apple's and Google's official badge
 * artwork, which their brand guidelines require for published apps.
 */
export const APP_STORE_LINKS = {
  apple: 'https://www.apple.com/app-store/',
  google: 'https://play.google.com/store/'
} as const;

@Component({
  selector: 'app-app-download',
  imports: [SmartImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-download.html',
  styleUrl: './app-download.scss'
})
export class AppDownload {
  protected readonly links = APP_STORE_LINKS;
}
