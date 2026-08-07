import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Aspect of the artwork, used to derive a width from the requested height. */
const ASPECT = 175 / 218;

/**
 * Foodie Inc logo mark: the maroon cloche resting on a capital "F".
 *
 * Traced from `src/assets/brand/foodie-logo.png`; `src/assets/brand/foodie-logo.svg`
 * is the same geometry as a standalone file for the favicon. Inlined rather than
 * loaded as an <img> so it renders during SSR with no extra request and no flash
 * of missing artwork. It is decorative wherever it sits next to the wordmark, so
 * it is hidden from assistive tech by default; pass a label when it appears
 * without adjacent text.
 *
 * The highlight on the dome is a hole punched in the fill rather than a white
 * stroke, so the mark keeps its shape on any background.
 */
@Component({
  selector: 'app-logo-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="logo-mark"
      [attr.width]="width()"
      [attr.height]="size()"
      viewBox="41 8 175 218"
      xmlns="http://www.w3.org/2000/svg"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false"
    >
      <g fill="var(--brand-mark)">
        <circle cx="128" cy="28" r="8" />
        <path
          fill-rule="evenodd"
          d="M70 85.5A58 53 0 0 1 186 85.5Z
             M113 42.7A48.5 44.5 0 0 0 81.6 72L88.3 74A41.5 37.5 0 0 1 115.2 49.3Z"
        />
        <rect x="53" y="93" width="152" height="15" rx="7.5" />
        <rect x="71" y="93" width="40" height="121" />
        <rect x="71" y="133" width="98" height="32" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: inline-flex; }
    .logo-mark { display: block; }
  `
})
export class LogoMark {
  /** Rendered height in pixels; the width follows from the artwork's aspect. */
  readonly size = input(28);

  /** Accessible name. Leave unset when the mark sits beside the wordmark. */
  readonly label = input('');

  protected readonly width = computed(() => Math.round(this.size() * ASPECT));
}
