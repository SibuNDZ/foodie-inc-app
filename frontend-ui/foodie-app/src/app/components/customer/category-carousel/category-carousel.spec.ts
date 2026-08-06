import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { CategoryCarousel, FALLBACK_SLIDES } from './category-carousel';
import { environment } from '../../../../environments/environment';

describe('CategoryCarousel', () => {
  let component: CategoryCarousel;
  let fixture: ComponentFixture<CategoryCarousel>;
  let httpMock: HttpTestingController;

  const showcaseUrl = `${environment.apiBaseUrl}/dishes/showcase`;

  const activeLabel = (): string =>
    fixture.nativeElement.querySelector('.slide.active .slide-label').textContent.trim();

  const click = (selector: string) => {
    fixture.nativeElement.querySelector(selector).click();
    fixture.detectChanges();
  };

  /** afterNextRender fires the showcase request once the fixture settles. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const respond = (body: any[]) => {
    httpMock.expectOne(r => r.url === showcaseUrl).flush(body);
    fixture.detectChanges();
  };

  const dish = (id: number, name: string, restaurant = "Doc's Kitchen") => ({
    id, name, imageUrl: `https://cdn.test/${id}.jpg`,
    restaurantId: 100 + id, restaurantName: restaurant, cuisineType: 'South African'
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCarousel, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCarousel);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await settle();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    respond([]);
    expect(component).toBeTruthy();
  });

  it('requests real dish photos on load', () => {
    const req = httpMock.expectOne(r => r.url === showcaseUrl);
    expect(req.request.params.get('limit')).toBe('8');
    req.flush([]);
  });

  it('renders the fallback tiles until real photos arrive', () => {
    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(FALLBACK_SLIDES.length);
    expect(activeLabel()).toBe('Pizza');
    respond([]);
  });

  it('keeps the fallback tiles when no dish has a photo yet', () => {
    respond([]);
    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(FALLBACK_SLIDES.length);
    expect(activeLabel()).toBe('Pizza');
  });

  it('keeps the fallback tiles when the showcase call fails', () => {
    httpMock.expectOne(r => r.url === showcaseUrl)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(FALLBACK_SLIDES.length);
  });

  it('swaps in real dish photos once loaded', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);

    const labels = Array.from(fixture.nativeElement.querySelectorAll('.slide-label'))
      .map(el => (el as HTMLElement).textContent?.trim());

    expect(labels).toEqual(['Bunny Chow', 'Shisanyama']);
    expect(activeLabel()).toBe('Bunny Chow');
  });

  it('credits the kitchen under the dish name', () => {
    respond([dish(1, 'Bunny Chow')]);
    expect(fixture.nativeElement.querySelector('.slide-sub').textContent.trim())
      .toBe("Doc's Kitchen");
  });

  it('describes each photo with the dish and its restaurant', () => {
    respond([dish(1, 'Bunny Chow')]);
    expect(fixture.nativeElement.querySelector('.slide-img').getAttribute('alt'))
      .toBe("Bunny Chow from Doc's Kitchen");
  });

  it('ignores dishes whose image url is blank', () => {
    respond([dish(1, 'Bunny Chow'), { ...dish(2, 'No Photo'), imageUrl: '   ' }]);

    const labels = Array.from(fixture.nativeElement.querySelectorAll('.slide-label'))
      .map(el => (el as HTMLElement).textContent?.trim());

    expect(labels).toEqual(['Bunny Chow']);
  });

  it('opens the restaurant behind a real dish photo', () => {
    respond([dish(1, 'Bunny Chow')]);
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    click('.slide.active .slide-btn');

    expect(spy).toHaveBeenCalledWith(['/restaurant', 101], {});
  });

  it('filters the listing when a fallback tile is opened', () => {
    respond([]);
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    click('.slide.active .slide-btn');

    expect(spy).toHaveBeenCalledWith(['/restaurants'], { queryParams: { query: 'pizza' } });
  });

  it('drops a photo whose image fails to load rather than showing a broken tile', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);

    const firstImg = fixture.nativeElement.querySelector('.slide-img');
    firstImg.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const labels = Array.from(fixture.nativeElement.querySelectorAll('.slide-label'))
      .map(el => (el as HTMLElement).textContent?.trim());

    expect(labels).toEqual(['Shisanyama']);
  });

  it('falls back to the tiles when every real photo fails to load', () => {
    respond([dish(1, 'Bunny Chow')]);

    fixture.nativeElement.querySelector('.slide-img').dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(FALLBACK_SLIDES.length);
  });

  it('advances and rewinds with the arrow buttons', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);

    click('.arrow-next');
    expect(activeLabel()).toBe('Shisanyama');

    click('.arrow-prev');
    expect(activeLabel()).toBe('Bunny Chow');
  });

  it('wraps around at both ends', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);

    click('.arrow-prev');
    expect(activeLabel()).toBe('Shisanyama');

    click('.arrow-next');
    expect(activeLabel()).toBe('Bunny Chow');
  });

  it('jumps to a slide via its dot and marks it selected', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama'), dish(3, 'Pap and Wors')]);

    const dots = fixture.nativeElement.querySelectorAll('.dot');
    dots[2].click();
    fixture.detectChanges();

    expect(activeLabel()).toBe('Pap and Wors');
    expect(dots[2].getAttribute('aria-selected')).toBe('true');
    expect(dots[0].getAttribute('aria-selected')).toBe('false');
  });

  it('lazy-loads every slide except the first', () => {
    respond([dish(1, 'A'), dish(2, 'B'), dish(3, 'C')]);

    const images = Array.from(fixture.nativeElement.querySelectorAll('.slide-img'));
    expect((images[0] as HTMLImageElement).getAttribute('loading')).toBe('eager');
    images.slice(1).forEach(img =>
      expect((img as HTMLImageElement).getAttribute('loading')).toBe('lazy'));
  });

  it('gives every slide image intrinsic dimensions so the box never shifts', () => {
    respond([dish(1, 'A')]);

    const img = fixture.nativeElement.querySelector('.slide-img');
    expect(img.getAttribute('width')).toBe('400');
    expect(img.getAttribute('height')).toBe('300');
  });

  it('hides inactive slides from assistive tech', () => {
    respond([dish(1, 'A'), dish(2, 'B')]);

    const slides = fixture.nativeElement.querySelectorAll('.slide');
    expect(slides[0].getAttribute('aria-hidden')).toBeNull();
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');
  });

  it('moves between slides with the arrow keys', () => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);
    const carousel = fixture.nativeElement.querySelector('.carousel');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(activeLabel()).toBe('Shisanyama');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(activeLabel()).toBe('Bunny Chow');
  });

  it('pauses on hover and resumes on leave', () => {
    respond([]);
    const carousel = fixture.nativeElement.querySelector('.carousel');

    carousel.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect((component as any).paused()).toBeTrue();

    carousel.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect((component as any).paused()).toBeFalse();
  });

  it('does not auto-advance while paused', fakeAsync(() => {
    respond([dish(1, 'Bunny Chow'), dish(2, 'Shisanyama')]);

    (component as any).pause();
    tick(11000);
    fixture.detectChanges();

    expect(activeLabel()).toBe('Bunny Chow');
    discardPeriodicTasks();
  }));
});
