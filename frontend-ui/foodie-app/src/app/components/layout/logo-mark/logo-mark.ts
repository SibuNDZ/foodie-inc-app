import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Foodie Inc logo mark: a serving cloche with fork tines, in the brand orange.
 *
 * Inlined rather than loaded as an <img> so it renders during SSR with no extra
 * request and no flash of missing artwork. It is decorative wherever it sits next
 * to the wordmark, so it is hidden from assistive tech by default; pass a label
 * when it appears without adjacent text.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="logo-mark"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false"
    >
      <circle cx="16" cy="6.4" r="2.2" fill="#F8BF73" />
      <path d="M4.5 21.4a11.5 11.5 0 0 1 23 0Z" fill="#F58C24" />
      <path
        d="M13 14.6v4.4M16 13.7v5.3M19 14.6v4.4"
        stroke="#2A1B40"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <rect x="1.8" y="22.1" width="28.4" height="3.4" rx="1.7" fill="#EE3124" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; }
    .logo-mark { display: block; }
  `
})
export class LogoMark {
  /** Rendered edge length in pixels. */
  readonly size = input(28);

  /** Accessible name. Leave unset when the mark sits beside the wordmark. */
  readonly label = input('');
}
