import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RestaurantService } from '../../../services/restaurant';
import { Restaurant } from '../../../models';

export const SUGGESTION_DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 6;

type LocationState = 'idle' | 'requesting' | 'granted' | 'unavailable';

@Component({
  selector: 'app-hero-search',
  imports: [FormsModule],
  templateUrl: './hero-search.html',
  styleUrl: './hero-search.scss'
})
export class HeroSearch {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly restaurantService = inject(RestaurantService);

  protected readonly query = signal('');
  protected readonly suggestions = signal<Restaurant[]>([]);
  protected readonly open = signal(false);
  protected readonly loading = signal(false);

  /** -1 means "no option is active"; Enter then submits the free-text query. */
  protected readonly activeIndex = signal(-1);

  protected readonly locationState = signal<LocationState>('idle');
  protected readonly coords = signal<{ lat: number; lng: number } | null>(null);
  protected readonly showManualLocation = signal(false);
  protected readonly manualLat = signal('');
  protected readonly manualLng = signal('');

  private readonly queryChanges = new Subject<string>();

  constructor() {
    this.queryChanges
      .pipe(
        debounceTime(SUGGESTION_DEBOUNCE_MS),
        distinctUntilChanged(),
        filter(term => term.trim().length > 0),
        switchMap(term => {
          this.loading.set(true);
          const position = this.coords();
          return this.restaurantService.getAllRestaurants({
            query: term,
            lat: position?.lat,
            lng: position?.lng
          });
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: results => {
          this.suggestions.set(results.slice(0, MAX_SUGGESTIONS));
          this.activeIndex.set(-1);
          this.loading.set(false);
          this.open.set(true);
        },
        error: () => {
          this.suggestions.set([]);
          this.loading.set(false);
        }
      });
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    if (!value.trim()) {
      this.suggestions.set([]);
      this.open.set(false);
      return;
    }
    this.queryChanges.next(value);
  }

  /** Asks for coordinates the first time the field is used, never during SSR. */
  protected onFocus(): void {
    if (this.suggestions().length) {
      this.open.set(true);
    }
    this.requestLocation();
  }

  /**
   * The explicit "use my location" control. Unlike the automatic request on
   * focus, this retries even after a previous denial, because the user has just
   * asked for it.
   */
  protected useMyLocation(): void {
    this.locationState.set('idle');
    this.requestLocation();
  }

  protected requestLocation(): void {
    if (this.locationState() !== 'idle') {
      return;
    }
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      this.locationState.set('unavailable');
      return;
    }

    this.locationState.set('requesting');
    navigator.geolocation.getCurrentPosition(
      position => {
        this.coords.set({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        this.locationState.set('granted');
      },
      () => {
        // Denied, timed out or unsupported: fall back to manual entry.
        this.locationState.set('unavailable');
      },
      { timeout: 8000, maximumAge: 300_000 }
    );
  }

  protected toggleManualLocation(): void {
    this.showManualLocation.update(shown => !shown);
  }

  /**
   * There is no geocoder in this app, so manual entry takes coordinates directly,
   * the same way the owner dashboard does.
   */
  protected applyManualLocation(): void {
    const lat = Number(this.manualLat());
    const lng = Number(this.manualLng());

    const valid = this.manualLat().trim() !== '' && this.manualLng().trim() !== ''
      && !Number.isNaN(lat) && !Number.isNaN(lng)
      && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    if (!valid) {
      return;
    }

    this.coords.set({ lat, lng });
    this.locationState.set('granted');
    this.showManualLocation.set(false);

    if (this.query().trim()) {
      this.queryChanges.next(this.query());
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;

    switch (event.key) {
      case 'ArrowDown':
        if (!count) return;
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.update(i => (i + 1) % count);
        break;
      case 'ArrowUp':
        if (!count) return;
        event.preventDefault();
        this.activeIndex.update(i => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        const active = this.activeIndex();
        if (this.open() && active >= 0 && active < count) {
          event.preventDefault();
          this.openRestaurant(this.suggestions()[active]);
        } else {
          this.submit();
        }
        break;
      }
      case 'Escape':
        this.close();
        break;
    }
  }

  protected submit(): void {
    this.close();
    const term = this.query().trim();
    this.router.navigate(['/restaurants'], {
      queryParams: term ? { query: term } : {}
    });
  }

  protected openRestaurant(restaurant: Restaurant): void {
    this.close();
    this.router.navigate(['/restaurant', restaurant.id]);
  }

  protected close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  protected distanceLabel(restaurant: Restaurant): string | null {
    const km = restaurant.distanceKm;
    if (km === undefined || km === null) {
      return null;
    }
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }
}
