import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { CuisineStrip, CUISINE_TILES } from './cuisine-strip';

describe('CuisineStrip', () => {
  let fixture: ComponentFixture<CuisineStrip>;
  let component: any;

  /**
   * How many cards fit depends on the width the runner gives the iframe, so the
   * slide tests pin it. Everything downstream (maxIndex, dots, wrapping) is
   * derived from this.
   */
  const withPerView = (n: number) => {
    component.perView.set(n);
    component.index.set(0);
    fixture.detectChanges();
  };

  const transform = (): string =>
    (fixture.nativeElement.querySelector('.track') as HTMLElement).style.transform;

  const dots = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.dot'));

  const tapFirstCard = () =>
    fixture.nativeElement.querySelector('.tile-link')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuisineStrip, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CuisineStrip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a card per cuisine', () => {
    expect(fixture.nativeElement.querySelectorAll('.tile').length).toBe(CUISINE_TILES.length);
  });

  it('links each card to the filtered listing', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('.tile-link'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs.length).toBe(CUISINE_TILES.length);
    hrefs.forEach(href => expect(href).toContain('/restaurants'));
    expect(hrefs[0]).toContain('query=' + CUISINE_TILES[0].query);
  });

  it('carries the whole menu, not a handful of headline cuisines', () => {
    const labels = CUISINE_TILES.map(t => t.label);

    expect(labels.length).toBeGreaterThan(30);
    expect(labels).toContain('Halal');
    expect(labels).toContain('Bubble tea');
    expect(labels).toContain('Caribbean');
    // Every label appears once, so no cuisine is listed twice under two keys.
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('gives every cuisine its own photo', () => {
    const images = CUISINE_TILES.map(t => t.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('uses real photography, not the retired vector tiles', () => {
    const srcs = Array.from(fixture.nativeElement.querySelectorAll('.photo'))
      .map(i => (i as HTMLImageElement).getAttribute('src') ?? '');

    expect(srcs.length).toBe(CUISINE_TILES.length);
    srcs.forEach(src => {
      expect(src).toContain('images.unsplash.com');
      expect(src).not.toContain('/categories/');
    });
  });

  it('describes every photo', () => {
    Array.from(fixture.nativeElement.querySelectorAll('.photo')).forEach(i =>
      expect((i as HTMLImageElement).getAttribute('alt')?.length).toBeGreaterThan(0));
  });

  it('keeps the offscreen cards lazy', () => {
    const loading = Array.from(fixture.nativeElement.querySelectorAll('.photo'))
      .map(i => (i as HTMLImageElement).getAttribute('loading'));

    expect(loading.slice(0, 3)).toEqual(['eager', 'eager', 'eager']);
    expect(loading.slice(3).every(v => v === 'lazy')).toBeTrue();
  });

  it('fixes an aspect ratio on every card so nothing shifts as photos land', () => {
    Array.from(fixture.nativeElement.querySelectorAll('.tile .frame')).forEach(frame =>
      expect((frame as HTMLElement).style.aspectRatio).toBe('4 / 5'));
  });

  it('labels the section by its heading', () => {
    const section = fixture.nativeElement.querySelector('.mood-section');
    expect(section.getAttribute('aria-labelledby')).toBe('cuisine-strip-heading');
    expect(fixture.nativeElement.querySelector('#cuisine-strip-heading')).toBeTruthy();
  });

  it('slides a track instead of scrolling a strip', () => {
    // The old native scroll container, and its scrollbar, are gone.
    expect(fixture.nativeElement.querySelector('.strip')).toBeNull();

    const viewport = fixture.nativeElement.querySelector('.viewport');
    expect(getComputedStyle(viewport).overflowX).not.toBe('auto');
    expect(getComputedStyle(viewport).overflowX).not.toBe('scroll');
    expect(fixture.nativeElement.querySelector('.track')).toBeTruthy();
  });

  describe('the left-hand category list', () => {
    it('offers every cuisine as a link', () => {
      const links = Array.from(fixture.nativeElement.querySelectorAll('.category-link'));

      expect(links.map(a => (a as HTMLElement).textContent?.trim()))
        .toEqual(CUISINE_TILES.map(t => t.label));
    });

    it('points each link at the same filtered listing as its card', () => {
      const listed = Array.from(fixture.nativeElement.querySelectorAll('.category-link'))
        .map(a => (a as HTMLAnchorElement).getAttribute('href'));
      const carded = Array.from(fixture.nativeElement.querySelectorAll('.tile-link'))
        .map(a => (a as HTMLAnchorElement).getAttribute('href'));

      expect(listed).toEqual(carded);
    });

    it('is a labelled navigation landmark', () => {
      const nav = fixture.nativeElement.querySelector('nav.category-list');
      expect(nav.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('sliding', () => {
    beforeEach(() => withPerView(3));

    it('starts at rest', () => {
      expect(transform()).toBe('translateX(calc(0 * (var(--tile-w) + var(--tile-gap))))');
    });

    it('shifts the track one card at a time', () => {
      fixture.nativeElement.querySelector('.arrow-next').click();
      fixture.detectChanges();

      expect(transform()).toBe('translateX(calc(-1 * (var(--tile-w) + var(--tile-gap))))');
    });

    /** Three visible, so the track stops with the last three cards on screen. */
    const lastIndex = () => CUISINE_TILES.length - 3;

    it('stops revealing empty space at the end and wraps instead', () => {
      component.goTo(lastIndex());
      fixture.detectChanges();
      expect(component.index()).toBe(lastIndex());

      fixture.nativeElement.querySelector('.arrow-next').click();
      fixture.detectChanges();
      expect(component.index()).toBe(0);
    });

    it('wraps backwards from the first card', () => {
      fixture.nativeElement.querySelector('.arrow-prev').click();
      fixture.detectChanges();

      expect(component.index()).toBe(lastIndex());
    });

    it('clamps a request past the end', () => {
      component.goTo(999);
      expect(component.index()).toBe(lastIndex());
    });

    it('moves with the left and right arrow keys', () => {
      const carousel: HTMLElement = fixture.nativeElement.querySelector('.carousel');

      carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.index()).toBe(1);

      carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.index()).toBe(0);
    });

    it('ignores keys it does not drive', () => {
      const carousel: HTMLElement = fixture.nativeElement.querySelector('.carousel');
      carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(component.index()).toBe(0);
    });

    it('gives one dot per screenful rather than per card', () => {
      expect(dots().length).toBe(Math.ceil(CUISINE_TILES.length / 3));
      expect(dots().length).toBeLessThan(CUISINE_TILES.length);
      expect(dots()[0].getAttribute('aria-current')).toBe('true');
    });

    it('jumps a whole screenful when a dot is clicked', () => {
      dots()[2].click();
      fixture.detectChanges();

      expect(component.index()).toBe(6);
      expect(dots()[2].getAttribute('aria-current')).toBe('true');
      expect(dots()[0].getAttribute('aria-current')).toBeNull();
    });

    it('marks the dot for the screenful the track is showing', () => {
      component.goTo(4);
      fixture.detectChanges();

      expect(dots()[1].getAttribute('aria-current')).toBe('true');
    });

    it('keeps the last dot selectable even though the track stops short', () => {
      dots().at(-1)!.click();
      fixture.detectChanges();

      expect(component.index()).toBe(CUISINE_TILES.length - 3);
      expect(dots().at(-1)!.getAttribute('aria-current')).toBe('true');
    });

    it('collapses to a single position when every card already fits', () => {
      withPerView(CUISINE_TILES.length);

      expect(component.maxIndex()).toBe(0);
      expect(dots().length).toBe(1);
    });
  });

  describe('swiping', () => {
    const swipe = (dx: number) => {
      const viewport: HTMLElement = fixture.nativeElement.querySelector('.viewport');
      viewport.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }));
      viewport.dispatchEvent(new PointerEvent('pointerup', { clientX: 200 + dx, bubbles: true }));
      fixture.detectChanges();
    };

    beforeEach(() => withPerView(3));

    it('advances on a swipe to the left', () => {
      swipe(-120);
      expect(component.index()).toBe(1);
    });

    it('goes back on a swipe to the right', () => {
      component.goTo(2);
      swipe(120);
      expect(component.index()).toBe(1);
    });

    it('treats a small drag as a tap and stays put', () => {
      swipe(-10);
      expect(component.index()).toBe(0);
    });

    it('does not open a card that was only swiped across', () => {
      const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl')
        .and.returnValue(Promise.resolve(true));

      swipe(-120);
      tapFirstCard();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('lets a genuine tap through', () => {
      const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl')
        .and.returnValue(Promise.resolve(true));

      swipe(-10);
      tapFirstCard();

      expect(navigate).toHaveBeenCalled();
    });

    it('goes back to opening cards on the tap after a swipe', () => {
      const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl')
        .and.returnValue(Promise.resolve(true));

      swipe(-120);
      tapFirstCard();
      tapFirstCard();

      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus', () => {
    beforeEach(() => withPerView(3));

    it('slides a card that is tabbed to from offscreen into view', () => {
      component.onTileFocus(9);
      expect(component.index()).toBe(7);
    });

    it('slides back for a card behind the current position', () => {
      component.goTo(4);
      component.onTileFocus(1);

      expect(component.index()).toBe(1);
    });

    it('leaves a card that is already visible alone', () => {
      component.goTo(2);
      component.onTileFocus(3);

      expect(component.index()).toBe(2);
    });
  });
});
