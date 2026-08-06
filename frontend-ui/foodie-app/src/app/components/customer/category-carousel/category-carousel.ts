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

export interface DishCategorySlide {
  /** Search term pushed to the listing when the slide is opened. */
  readonly query: string;
  readonly label: string;
  readonly image: string;
  readonly alt: string;
}

export const DISH_CATEGORY_SLIDES: readonly DishCategorySlide[] = [
  { query: 'pizza', label: 'Pizza', image: '/categories/pizza.svg', alt: 'Wood-fired pizza' },
  { query: 'burger', label: 'Burgers', image: '/categories/burgers.svg', alt: 'Stacked beef burger' },
  { query: 'sushi', label: 'Sushi', image: '/categories/sushi.svg', alt: 'Plate of nigiri sushi' },
  { query: 'thai', label: 'Thai', image: '/categories/thai.svg', alt: 'Bowl of Thai noodles' },
  { query: 'chinese', label: 'Chinese', image: '/categories/chinese.svg', alt: 'Chinese takeaway box' },
  { query: 'brunch', label: 'Brunch', image: '/categories/brunch.svg', alt: 'Stack of pancakes' }
];

const ADVANCE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;

@Component({
  selector: 'app-category-carousel',
  templateUrl: './category-carousel.html',
  styleUrl: './category-carousel.scss'
})
export class CategoryCarousel {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly slides = DISH_CATEGORY_SLIDES;
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.slides[this.index()]);

  /** True while the user is hovering or focused inside, which suspends auto-advance. */
  protected readonly paused = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStartX: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender never runs on the server, so no timer is ever created during SSR.
    afterNextRender(() => {
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

  protected next(): void {
    this.index.update(i => (i + 1) % this.slides.length);
  }

  protected previous(): void {
    this.index.update(i => (i - 1 + this.slides.length) % this.slides.length);
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

  protected openCategory(slide: DishCategorySlide): void {
    this.router.navigate(['/restaurants'], { queryParams: { query: slide.query } });
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

  /** Arrow keys move between slides when focus is inside the carousel. */
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
