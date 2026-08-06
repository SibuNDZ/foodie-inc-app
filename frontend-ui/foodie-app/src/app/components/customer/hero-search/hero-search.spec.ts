import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { HeroSearch, SUGGESTION_DEBOUNCE_MS } from './hero-search';
import { environment } from '../../../../environments/environment';

describe('HeroSearch', () => {
  let component: HeroSearch;
  let fixture: ComponentFixture<HeroSearch>;
  let httpMock: HttpTestingController;

  const listUrl = `${environment.apiBaseUrl}/restaurants`;

  const input = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.search-input');

  const type = (value: string) => {
    const el = input();
    el.value = value;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const key = (name: string) => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  };

  const flushSuggestions = (body: any[]) => {
    tick(SUGGESTION_DEBOUNCE_MS);
    httpMock.expectOne(r => r.url === listUrl).flush(body);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSearch, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSearch);
    component = fixture.componentInstance;
    // Geolocation is requested on focus; keep it out of the way unless a test wants it.
    spyOn(component as any, 'requestLocation');
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the heading, subheading and placeholder from the brief', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent.trim())
      .toBe('Discover Delicious Food');
    expect(fixture.nativeElement.querySelector('.hero-sub').textContent.trim())
      .toBe('Order from the best restaurants in your area');
    expect(input().getAttribute('placeholder')).toBe('Search restaurants or cuisines…');
  });

  it('exposes the combobox pattern to assistive tech', () => {
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().getAttribute('aria-controls')).toBe('restaurant-suggestions');
  });

  it('waits for the debounce before querying', fakeAsync(() => {
    type('sushi');

    httpMock.expectNone(r => r.url === listUrl);

    tick(SUGGESTION_DEBOUNCE_MS);
    httpMock.expectOne(r => r.url === listUrl).flush([]);
  }));

  it('opens a listbox of suggestions after typing', fakeAsync(() => {
    type('su');
    flushSuggestions([
      { id: 1, name: 'Sushi Bar', cuisineType: 'Japanese' },
      { id: 2, name: 'Sushi Co', cuisineType: 'Japanese' }
    ]);

    const options = fixture.nativeElement.querySelectorAll('.suggestion');
    expect(options.length).toBe(2);
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.suggestions').getAttribute('role')).toBe('listbox');
  }));

  it('shows a distance badge only when the API returned a distance', fakeAsync(() => {
    type('su');
    flushSuggestions([
      { id: 1, name: 'Near Place', distanceKm: 0.4 },
      { id: 2, name: 'Far Place', distanceKm: 12.3 },
      { id: 3, name: 'Unknown Place' }
    ]);

    const badges = Array.from(fixture.nativeElement.querySelectorAll('.distance-badge'))
      .map(b => (b as HTMLElement).textContent?.trim());

    expect(badges).toEqual(['400 m', '12.3 km']);
  }));

  it('closes the suggestions when the query is cleared', fakeAsync(() => {
    type('su');
    flushSuggestions([{ id: 1, name: 'Sushi Bar' }]);

    type('');
    expect(fixture.nativeElement.querySelector('.suggestions')).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
  }));

  it('moves through options with the arrow keys and tracks aria-activedescendant', fakeAsync(() => {
    type('su');
    flushSuggestions([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);

    key('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe('suggestion-0');

    key('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe('suggestion-1');

    // Wraps back to the top.
    key('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe('suggestion-0');

    key('ArrowUp');
    expect(input().getAttribute('aria-activedescendant')).toBe('suggestion-1');
  }));

  it('closes the dropdown on Escape', fakeAsync(() => {
    type('su');
    flushSuggestions([{ id: 1, name: 'Sushi Bar' }]);

    key('Escape');
    expect(fixture.nativeElement.querySelector('.suggestions')).toBeNull();
  }));

  it('opens the highlighted restaurant on Enter', fakeAsync(() => {
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    type('su');
    flushSuggestions([{ id: 7, name: 'Sushi Bar' }]);

    key('ArrowDown');
    key('Enter');

    expect(spy).toHaveBeenCalledWith(['/restaurant', 7]);
  }));

  it('submits the free-text query on Enter when nothing is highlighted', fakeAsync(() => {
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    type('sushi');
    flushSuggestions([{ id: 7, name: 'Sushi Bar' }]);

    key('Enter');

    expect(spy).toHaveBeenCalledWith(['/restaurants'], { queryParams: { query: 'sushi' } });
  }));

  it('submits from the Search button', fakeAsync(() => {
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    type('thai');
    flushSuggestions([]);

    fixture.nativeElement.querySelector('.search-btn').click();

    expect(spy).toHaveBeenCalledWith(['/restaurants'], { queryParams: { query: 'thai' } });
  }));

  it('offers manual entry when the browser gives no location', fakeAsync(() => {
    (component as any).locationState.set('unavailable');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.location-status').textContent)
      .toContain('not sorted by distance');

    fixture.nativeElement.querySelector('.link-btn').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.manual-location')).toBeTruthy();
  }));

  it('accepts valid manual coordinates and rejects out-of-range ones', fakeAsync(() => {
    (component as any).locationState.set('unavailable');
    (component as any).showManualLocation.set(true);

    (component as any).manualLat.set('999');
    (component as any).manualLng.set('18.4');
    (component as any).applyManualLocation();
    expect((component as any).coords()).toBeNull();

    (component as any).manualLat.set('-33.9249');
    (component as any).manualLng.set('18.4241');
    (component as any).applyManualLocation();
    expect((component as any).coords()).toEqual({ lat: -33.9249, lng: 18.4241 });
  }));

  it('sends the known coordinates with the suggestion query', fakeAsync(() => {
    (component as any).coords.set({ lat: -33.9249, lng: 18.4241 });

    type('su');
    tick(SUGGESTION_DEBOUNCE_MS);

    const req = httpMock.expectOne(r => r.url === listUrl);
    expect(req.request.params.get('lat')).toBe('-33.9249');
    expect(req.request.params.get('lng')).toBe('18.4241');
    req.flush([]);
  }));

  afterEach(() => httpMock.verify());
});
