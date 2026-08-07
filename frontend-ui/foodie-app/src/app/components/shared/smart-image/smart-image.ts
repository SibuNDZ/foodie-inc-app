import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { LogoMark } from '../../layout/logo-mark/logo-mark';

/**
 * An image in a fixed aspect-ratio box that degrades to branded artwork.
 *
 * Two problems this solves everywhere images appear:
 *
 * - **Layout shift.** The frame reserves its space from the aspect ratio, so
 *   nothing reflows when the bytes land, however slow the network.
 * - **Dead sources.** Restaurant `imageUrl` values are arbitrary URLs entered by
 *   owners, and the curated photos live on a third-party CDN. Either can rot. On
 *   error the frame swaps to a branded gradient with the logo mark rather than
 *   rendering a broken-image glyph.
 */
@Component({
  selector: 'app-smart-image',
  imports: [LogoMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './smart-image.html',
  styleUrl: './smart-image.scss'
})
export class SmartImage {
  readonly src = input.required<string>();

  /** Describe the photo. Pass '' for purely decorative imagery. */
  readonly alt = input.required<string>();

  /** Any valid CSS aspect-ratio, e.g. '4 / 3' or '16 / 9'. */
  readonly aspectRatio = input('4 / 3');

  /** Below-the-fold images should stay lazy; above-the-fold should not. */
  readonly lazy = input(true);

  /** The one hero image per page: loads eagerly at high fetch priority. */
  readonly priority = input(false);

  readonly rounded = input(true);

  /**
   * Raised when the source fails. The branded fallback is already showing by
   * then; this lets a parent take a different route, such as dropping a
   * restaurant's dead photo in favour of one that still loads.
   */
  readonly loadFailed = output<void>();

  protected readonly failed = signal(false);

  protected readonly loadingAttr = computed(() =>
    this.priority() || !this.lazy() ? 'eager' : 'lazy');

  protected readonly fetchPriorityAttr = computed(() =>
    this.priority() ? 'high' : null);

  /** A decorative image must not announce itself, even as a fallback. */
  protected readonly decorative = computed(() => this.alt().trim() === '');

  constructor() {
    // A new source deserves a fresh attempt; without this a single failure would
    // stick the frame in fallback for every later image.
    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }

  protected onError(): void {
    this.failed.set(true);
    this.loadFailed.emit();
  }
}
