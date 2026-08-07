import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CuisineStrip, CUISINE_TILES } from './cuisine-strip';

describe('CuisineStrip', () => {
  let fixture: ComponentFixture<CuisineStrip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuisineStrip, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CuisineStrip);
    fixture.detectChanges();
  });

  it('renders a tile per cuisine', () => {
    expect(fixture.nativeElement.querySelectorAll('.tile').length).toBe(CUISINE_TILES.length);
  });

  it('links each tile to the filtered listing', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('.tile-link'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs[0]).toContain('/restaurants');
    expect(hrefs[0]).toContain('query=burger');
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

  it('exposes the strip as a labelled, focusable scroll region', () => {
    const strip = fixture.nativeElement.querySelector('.strip');
    expect(strip.getAttribute('aria-label')).toBeTruthy();
    expect(strip.getAttribute('tabindex')).toBe('0');
  });

  it('labels the section by its heading', () => {
    const section = fixture.nativeElement.querySelector('.strip-section');
    expect(section.getAttribute('aria-labelledby')).toBe('cuisine-strip-heading');
    expect(fixture.nativeElement.querySelector('#cuisine-strip-heading')).toBeTruthy();
  });
});
