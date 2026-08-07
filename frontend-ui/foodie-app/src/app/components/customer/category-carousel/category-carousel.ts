import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { DishService } from '../../../services/dish';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { ImageKey, imageUrl, primaryImage } from '../../../../assets/images/manifest';

export interface CarouselSlide {
  /** Stable key for tracking. */
  readonly key: string;
  readonly label: string;
  readonly image: string;
  readonly alt: string;
  /** Where clicking the slide goes. */
  readonly link: readonly unknown[];
  readonly queryParams?: Record<string, string>;
  /** Set on real dish photos; the fallback tiles leave it undefined. */
  readonly caption?: string;
}

/** Cuisine keys shown when the catalogue has no dish photography of its own. */
const CUISINE_SLIDES: ReadonlyArray<{ key: ImageKey; label: string; query: string }> = [
  { key: 'burgers', label: 'Burgers', query: 'burger' },
  { key: 'pizza', label: 'Pizza', query: 'pizza' },
  { key: 'sushi', label: 'Sushi', query: 'sushi' },
  { key: 'thai', label: 'Thai', query: 'thai' },
  { key: 'chinese', label: 'Chinese', query: 'chinese' },
  { key: 'brunch', label: 'Brunch', query: 'brunch' }
];

/**
 * Curated cuisine photography, shown until real dish photos load and whenever no
 * restaurant has uploaded a dish image yet. Keeps the carousel appetizing on a
 * cold catalogue rather than empty.
 */
export const FALLBACK_SLIDES: readonly CarouselSlide[] = CUISINE_SLIDES.map(c => {
  const photo = primaryImage(c.key);
  return {
    key: c.key,
    label: c.label,
    image: imageUrl(photo, 900),
    alt: photo.alt,
    link: ['/restaurants'],
    queryParams: { query: c.query }
  };
});

const ADVANCE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const SHOWCASE_LIMIT = 8;

@Component({
  selector: 'app-category-carousel',
  imports: [SmartImage],
  templateUrl: './category-carousel.html',
  styleUrl: './category-carousel.scss'
})
export class CategoryCarousel {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly dishService = inject(DishService);

  /** Real dish photos, empty until they load. */
  private readonly dishSlides = signal<CarouselSlide[]>([]);

  /** Real photos when we have them, otherwise the static tiles. */
  protected readonly slides = computed<readonly CarouselSlide[]>(() =>
    this.dishSlides().length ? this.dishSlides() : FALLBACK_SLIDES);

  protected readonly index = signal(0);
  protected readonly current = computed(() => this.slides()[this.index()]);
  protected readonly paused = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStartX: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender never runs on the server, so neither the fetch nor the timer
    // exists during SSR. The static tiles are what gets server-rendered.
    afterNextRender(() => {
      this.loadShowcase();

      if (this.prefersReducedMotion()) {
        return;
      }
      this.timer = setInterval(() => {
        if (!this.paused()) {
          this.next();
        }
      }, ADVANCE_INTERVAL_MS);
    });

    destroyRef.onDestroy(() => this.stopTimer());
  }

  private loadShowcase(): void {
    this.dishService.getShowcaseDishes(SHOWCASE_LIMIT).subscribe({
      next: dishes => {
        const usable = dishes.filter(dish => !!dish.imageUrl?.trim());
        if (!usable.length) {
          return; // keep the fallback tiles
        }

        this.dishSlides.set(usable.map(dish => ({
          key: `dish-${dish.id}`,
          label: dish.name,
          image: dish.imageUrl,
          alt: `${dish.name} from ${dish.restaurantName}`,
          link: ['/restaurant', dish.restaurantId],
          caption: dish.restaurantName
        })));
        this.index.set(0);
      },
      // A failed showcase call must not break the hero; the tiles stay.
      error: () => undefined
    });
  }

  /**
   * A restaurant's photo URL is arbitrary and can rot. Drop that slide so the
   * carousel shows food that actually loads, rather than branded artwork
   * captioned with a dish name.
   *
   * Curated cuisine slides are left alone: there is nothing better to fall back
   * to, and SmartImage is already showing the branded frame.
   */
  protected onImageFailed(slide: CarouselSlide): void {
    if (!this.dishSlides().some(s => s.key === slide.key)) {
      return;
    }
    this.dishSlides.set(this.dishSlides().filter(s => s.key !== slide.key));
    this.index.set(0);
  }

  protected next(): void {
    this.index.update(i => (i + 1) % this.slides().length);
  }

  protected previous(): void {
    this.index.update(i => (i - 1 + this.slides().length) % this.slides().length);
  }

  protected goTo(index: number): void {
    this.index.set(index);
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }

  protected openSlide(slide: CarouselSlide): void {
    this.router.navigate(slide.link as unknown[],
      slide.queryParams ? { queryParams: slide.queryParams } : {});
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) {
      return;
    }
    const delta = (event.changedTouches[0]?.clientX ?? this.touchStartX) - this.touchStartX;
    this.touchStartX = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return;
    }
    delta < 0 ? this.next() : this.previous();
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

  private prefersReducedMotion(): boolean {
    return isPlatformBrowser(this.platformId)
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
