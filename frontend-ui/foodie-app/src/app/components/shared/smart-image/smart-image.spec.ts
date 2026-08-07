import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartImage } from './smart-image';

describe('SmartImage', () => {
  let fixture: ComponentFixture<SmartImage>;

  const img = (): HTMLImageElement | null =>
    fixture.nativeElement.querySelector('.photo');
  const fallback = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.fallback');
  const frame = (): HTMLElement =>
    fixture.nativeElement.querySelector('.frame');

  const create = (inputs: Record<string, unknown>) => {
    fixture = TestBed.createComponent(SmartImage);
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
  };

  const breakImage = () => {
    img()!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SmartImage] }).compileComponents();
  });

  it('renders the photo with its alt text', () => {
    create({ src: '/a.jpg', alt: 'Wood-fired pizza' });

    expect(img()!.getAttribute('src')).toBe('/a.jpg');
    expect(img()!.getAttribute('alt')).toBe('Wood-fired pizza');
    expect(fallback()).toBeNull();
  });

  it('reserves space from the aspect ratio so nothing reflows', () => {
    create({ src: '/a.jpg', alt: 'x', aspectRatio: '16 / 9' });
    expect(frame().style.aspectRatio).toBe('16 / 9');
  });

  it('defaults to a 4:3 box', () => {
    create({ src: '/a.jpg', alt: 'x' });
    expect(frame().style.aspectRatio).toBe('4 / 3');
  });

  it('lazy-loads by default', () => {
    create({ src: '/a.jpg', alt: 'x' });
    expect(img()!.getAttribute('loading')).toBe('lazy');
    expect(img()!.getAttribute('fetchpriority')).toBeNull();
  });

  it('loads eagerly when lazy is turned off', () => {
    create({ src: '/a.jpg', alt: 'x', lazy: false });
    expect(img()!.getAttribute('loading')).toBe('eager');
  });

  it('marks a priority image eager and high fetch priority', () => {
    create({ src: '/a.jpg', alt: 'x', priority: true });

    expect(img()!.getAttribute('loading')).toBe('eager');
    expect(img()!.getAttribute('fetchpriority')).toBe('high');
  });

  it('swaps to branded artwork when the source fails', () => {
    create({ src: '/gone.jpg', alt: 'Sushi platter' });

    breakImage();

    expect(img()).toBeNull();
    expect(fallback()).toBeTruthy();
    expect(fallback()!.querySelector('app-logo-mark')).toBeTruthy();
  });

  it('keeps the description available on the fallback', () => {
    create({ src: '/gone.jpg', alt: 'Sushi platter' });
    breakImage();

    expect(fallback()!.getAttribute('role')).toBe('img');
    expect(fallback()!.getAttribute('aria-label')).toBe('Sushi platter');
  });

  it('keeps a decorative fallback silent for screen readers', () => {
    create({ src: '/gone.jpg', alt: '' });
    breakImage();

    expect(fallback()!.getAttribute('aria-hidden')).toBe('true');
    expect(fallback()!.getAttribute('role')).toBeNull();
  });

  it('holds the frame size through a failure', () => {
    create({ src: '/gone.jpg', alt: 'x', aspectRatio: '3 / 2' });
    breakImage();

    expect(frame().style.aspectRatio).toBe('3 / 2');
  });

  it('gives a new source a fresh attempt after a failure', () => {
    create({ src: '/gone.jpg', alt: 'x' });
    breakImage();
    expect(fallback()).toBeTruthy();

    fixture.componentRef.setInput('src', '/works.jpg');
    fixture.detectChanges();

    expect(fallback()).toBeNull();
    expect(img()!.getAttribute('src')).toBe('/works.jpg');
  });

  it('reports the failure so a parent can take a different route', () => {
    create({ src: '/gone.jpg', alt: 'x' });

    let raised = 0;
    fixture.componentInstance.loadFailed.subscribe(() => raised++);

    breakImage();

    expect(raised).toBe(1);
  });

  it('rounds its corners unless asked not to', () => {
    create({ src: '/a.jpg', alt: 'x' });
    expect(frame().classList).toContain('frame--rounded');

    fixture.componentRef.setInput('rounded', false);
    fixture.detectChanges();
    expect(frame().classList).not.toContain('frame--rounded');
  });
});
