import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDownload, APP_STORE_LINKS } from './app-download';

describe('AppDownload', () => {
  let component: AppDownload;
  let fixture: ComponentFixture<AppDownload>;

  const badges = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.badge')) as HTMLAnchorElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDownload]
    }).compileComponents();

    fixture = TestBed.createComponent(AppDownload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders both store badges', () => {
    const labels = badges().map(b => b.querySelector('.badge-large')?.textContent?.trim());
    expect(labels).toEqual(['App Store', 'Google Play']);
  });

  it('points each badge at its configured store URL', () => {
    expect(badges()[0].getAttribute('href')).toBe(APP_STORE_LINKS.apple);
    expect(badges()[1].getAttribute('href')).toBe(APP_STORE_LINKS.google);
  });

  it('opens store links safely in a new tab', () => {
    badges().forEach(badge => {
      expect(badge.getAttribute('target')).toBe('_blank');
      expect(badge.getAttribute('rel')).toContain('noopener');
    });
  });

  it('gives the phone illustration alt text and intrinsic dimensions', () => {
    const phone: HTMLImageElement = fixture.nativeElement.querySelector('.phone');
    expect(phone.getAttribute('alt')).toContain('smartphone');
    expect(phone.getAttribute('width')).toBe('300');
    expect(phone.getAttribute('height')).toBe('600');
    expect(phone.getAttribute('loading')).toBe('lazy');
  });

  it('hides the brand glyphs from assistive tech, leaving the text to describe the link', () => {
    fixture.nativeElement.querySelectorAll('.badge i').forEach((el: Element) => {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('labels the section for assistive tech', () => {
    const section = fixture.nativeElement.querySelector('.download');
    expect(section.getAttribute('aria-labelledby')).toBe('download-heading');
    expect(fixture.nativeElement.querySelector('#download-heading')).toBeTruthy();
  });
});
