import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { CategoryCarousel, DISH_CATEGORY_SLIDES } from './category-carousel';

describe('CategoryCarousel', () => {
  let component: CategoryCarousel;
  let fixture: ComponentFixture<CategoryCarousel>;

  const activeLabel = (): string =>
    fixture.nativeElement.querySelector('.slide.active .slide-label').textContent.trim();

  const click = (selector: string) => {
    fixture.nativeElement.querySelector(selector).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCarousel, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders every dish category as a slide with a dot', () => {
    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(DISH_CATEGORY_SLIDES.length);
    expect(fixture.nativeElement.querySelectorAll('.dot').length).toBe(DISH_CATEGORY_SLIDES.length);
  });

  it('starts on the first slide', () => {
    expect(activeLabel()).toBe('Pizza');
  });

  it('advances and rewinds with the arrow buttons', () => {
    click('.arrow-next');
    expect(activeLabel()).toBe('Burgers');

    click('.arrow-prev');
    expect(activeLabel()).toBe('Pizza');
  });

  it('wraps around at both ends', () => {
    click('.arrow-prev');
    expect(activeLabel()).toBe('Brunch');

    click('.arrow-next');
    expect(activeLabel()).toBe('Pizza');
  });

  it('jumps to a slide via its dot and marks it selected', () => {
    const dots = fixture.nativeElement.querySelectorAll('.dot');
    dots[2].click();
    fixture.detectChanges();

    expect(activeLabel()).toBe('Sushi');
    expect(dots[2].getAttribute('aria-selected')).toBe('true');
    expect(dots[0].getAttribute('aria-selected')).toBe('false');
  });

  it('lazy-loads every slide except the first', () => {
    const images = Array.from(fixture.nativeElement.querySelectorAll('.slide-img'));
    expect((images[0] as HTMLImageElement).getAttribute('loading')).toBe('eager');
    images.slice(1).forEach(img => {
      expect((img as HTMLImageElement).getAttribute('loading')).toBe('lazy');
    });
  });

  it('gives every slide image alt text and intrinsic dimensions', () => {
    Array.from(fixture.nativeElement.querySelectorAll('.slide-img')).forEach(img => {
      const image = img as HTMLImageElement;
      expect(image.getAttribute('alt')).toBeTruthy();
      expect(image.getAttribute('width')).toBe('400');
      expect(image.getAttribute('height')).toBe('300');
    });
  });

  it('hides inactive slides from assistive tech', () => {
    const slides = fixture.nativeElement.querySelectorAll('.slide');
    expect(slides[0].getAttribute('aria-hidden')).toBeNull();
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');
  });

  it('moves between slides with the arrow keys', () => {
    const carousel = fixture.nativeElement.querySelector('.carousel');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(activeLabel()).toBe('Burgers');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(activeLabel()).toBe('Pizza');
  });

  it('pauses on hover and resumes on leave', () => {
    const carousel = fixture.nativeElement.querySelector('.carousel');

    carousel.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect((component as any).paused()).toBeTrue();

    carousel.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect((component as any).paused()).toBeFalse();
  });

  it('navigates to the filtered listing when a slide is opened', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');

    click('.slide.active .slide-btn');

    expect(spy).toHaveBeenCalledWith(['/restaurants'], { queryParams: { query: 'pizza' } });
  });

  it('does not auto-advance while paused', fakeAsync(() => {
    (component as any).pause();
    tick(11000);
    fixture.detectChanges();

    expect(activeLabel()).toBe('Pizza');
    discardPeriodicTasks();
  }));
});
