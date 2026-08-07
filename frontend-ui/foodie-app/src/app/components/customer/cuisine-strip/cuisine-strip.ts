import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef,
  afterNextRender, computed, inject, signal, viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { ImageKey, imageUrl, primaryImage } from '../../../../assets/images/manifest';

export interface CuisineTile {
  readonly key: string;
  readonly label: string;
  readonly image: string;
  readonly alt: string;
  readonly query: string;
}

const CUISINES: ReadonlyArray<{ key: ImageKey; label: string; query: string }> = [
  { key: 'grocery', label: 'Grocery', query: 'grocery' },
  { key: 'pizza', label: 'Pizza', query: 'pizza' },
  { key: 'fastFood', label: 'Fast food', query: 'fast food' },
  { key: 'iceCream', label: 'Ice cream', query: 'ice cream' },
  { key: 'sushi', label: 'Sushi', query: 'sushi' },
  { key: 'wings', label: 'Wings', query: 'wings' },
  { key: 'burgers', label: 'Burgers', query: 'burger' },
  { key: 'healthy', label: 'Healthy', query: 'healthy' },
  { key: 'indian', label: 'Indian', query: 'indian' },
  { key: 'mexican', label: 'Mexican', query: 'mexican' },
  { key: 'gifts', label: 'Gifts', query: 'gifts' },
  { key: 'chinese', label: 'Chinese', query: 'chinese' },
  { key: 'thai', label: 'Thai', query: 'thai' },
  { key: 'brunch', label: 'Breakfast', query: 'breakfast' },
  { key: 'greek', label: 'Greek', query: 'greek' },
  { key: 'coffee', label: 'Coffee', query: 'coffee' },
  { key: 'bubbleTea', label: 'Bubble tea', query: 'bubble tea' },
  { key: 'korean', label: 'Korean', query: 'korean' },
  { key: 'smoothies', label: 'Smoothies', query: 'smoothies' },
  { key: 'asian', label: 'Asian', query: 'asian' },
  { key: 'poke', label: 'Poke', query: 'poke' },
  { key: 'halal', label: 'Halal', query: 'halal' },
  { key: 'vietnamese', label: 'Vietnamese', query: 'vietnamese' },
  { key: 'italian', label: 'Italian', query: 'italian' },
  { key: 'seafood', label: 'Seafood', query: 'seafood' },
  { key: 'soup', label: 'Soup', query: 'soup' },
  { key: 'comfortFood', label: 'Comfort food', query: 'comfort food' },
  { key: 'bbq', label: 'BBQ', query: 'bbq' },
  { key: 'vegan', label: 'Vegan', query: 'vegan' },
  { key: 'streetFood', label: 'Street food', query: 'street food' },
  { key: 'japanese', label: 'Japanese', query: 'japanese' },
  { key: 'sandwiches', label: 'Sandwiches', query: 'sandwiches' },
  { key: 'caribbean', label: 'Caribbean', query: 'caribbean' }
];

export const CUISINE_TILES: readonly CuisineTile[] = CUISINES.map(c => {
  const photo = primaryImage(c.key);
  return {
    key: c.key,
    label: c.label,
    image: imageUrl(photo, 800),
    alt: photo.alt,
    query: c.query
  };
});

/** Cards visible before the browser has measured anything, including on the server. */
const DEFAULT_PER_VIEW = 3;

const AUTOPLAY_MS = 5500;

/** Below this a drag is a tap that wandered, not a swipe. */
const SWIPE_PX = 45;

/**
 * The cuisine browser: a list of every category on the left, and a sliding
 * carousel of the same categories as large photo cards on the right.
 *
 * The two halves are deliberate. The carousel is the display surface and only
 * ever shows about three cards, so on its own it hides most of the menu behind
 * a rotation; the list beside it puts every category one click away and gives
 * keyboard and screen-reader users a plain set of links to walk. Both point at
 * the same filtered listing.
 *
 * The carousel is a translated track rather than a native scroll container, so
 * there is no scrollbar to hide and slides move under an eased transition.
 * Everything that needs measurement or a timer is inside `afterNextRender`,
 * which does not run on the server; the server-rendered markup is the first
 * `DEFAULT_PER_VIEW` cards at rest.
 */
@Component({
  selector: 'app-cuisine-strip',
  imports: [RouterLink, SmartImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuisine-strip.html',
  styleUrl: './cuisine-strip.scss'
})
export class CuisineStrip {
  protected readonly tiles = CUISINE_TILES;

  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  /** Index of the leftmost visible card. */
  protected readonly index = signal(0);

  protected readonly perView = signal(DEFAULT_PER_VIEW);

  /** Furthest left the track can go before it runs out of cards to reveal. */
  protected readonly maxIndex = computed(() =>
    Math.max(0, this.tiles.length - this.perView()));

  /**
   * Dots count pages, not positions. With this many cuisines a dot per position
   * would be thirty-odd targets nobody can aim at; a dot per screenful is a
   * readable "you are here" and still reaches every card.
   */
  protected readonly dots = computed(() =>
    Array.from({ length: Math.ceil(this.tiles.length / this.perView()) }, (_, i) => i));

  protected readonly currentDot = computed(() =>
    Math.min(this.dots().length - 1, Math.floor(this.index() / this.perView())));

  /**
   * Card width and gap are CSS, so the shift is expressed in the same terms.
   * That keeps the track honest across breakpoints without measuring anything.
   */
  protected readonly trackShift = computed(() =>
    `translateX(calc(${-this.index()} * (var(--tile-w) + var(--tile-gap))))`);

  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private swiped = false;
  private pointerStartX = 0;

  constructor() {
    afterNextRender(() => {
      this.measure();

      const onResize = () => this.measure();
      window.addEventListener('resize', onResize, { passive: true });

      // A swipe that started on a card must not also open that card. This has to
      // be a capture-phase listener on the viewport: RouterLink's own click
      // handler sits on the anchor and does not consult defaultPrevented, so the
      // only way to stop it is to take the event before it arrives.
      const viewport = this.viewport().nativeElement;
      const onClickCapture = (event: Event) => {
        if (this.swiped) {
          this.swiped = false;
          event.preventDefault();
          event.stopPropagation();
        }
      };
      viewport.addEventListener('click', onClickCapture, { capture: true });

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timer = setInterval(() => {
          if (!this.paused && this.maxIndex() > 0) {
            this.next();
          }
        }, AUTOPLAY_MS);
      }

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', onResize);
        viewport.removeEventListener('click', onClickCapture, { capture: true });
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      });
    });
  }

  protected next(): void {
    this.index.update(i => (i >= this.maxIndex() ? 0 : i + 1));
  }

  protected previous(): void {
    this.index.update(i => (i <= 0 ? this.maxIndex() : i - 1));
  }

  protected goTo(i: number): void {
    this.index.set(Math.min(Math.max(i, 0), this.maxIndex()));
  }

  /** Jumps a whole screenful, which is what the dots address. */
  protected goToPage(page: number): void {
    this.goTo(page * this.perView());
  }

  protected pause(): void {
    this.paused = true;
  }

  protected resume(): void {
    this.paused = false;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
    this.swiped = false;
  }

  protected onPointerUp(event: PointerEvent): void {
    const dx = event.clientX - this.pointerStartX;
    if (Math.abs(dx) < SWIPE_PX) {
      return;
    }
    this.swiped = true;
    if (dx < 0) {
      this.next();
    } else {
      this.previous();
    }
  }

  /** Tabbing must never land on a card that is sitting outside the viewport. */
  protected onTileFocus(i: number): void {
    const first = this.index();
    if (i < first) {
      this.goTo(i);
    } else if (i > first + this.perView() - 1) {
      this.goTo(i - this.perView() + 1);
    }
  }

  /** How many whole cards fit, derived from what the browser actually laid out. */
  private measure(): void {
    const viewport = this.viewport().nativeElement;
    const track = viewport.firstElementChild as HTMLElement | null;
    const tile = track?.firstElementChild as HTMLElement | null;
    if (!track || !tile) {
      return;
    }

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = tile.getBoundingClientRect().width + gap;
    if (step <= 0) {
      return;
    }

    this.perView.set(Math.max(1, Math.floor((viewport.clientWidth + gap) / step)));
    this.index.update(i => Math.min(i, this.maxIndex()));
  }
}
