import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Footer, SOCIAL_LINKS } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  const hrefs = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.footer-col a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links to About us and Careers', () => {
    expect(hrefs()).toContain('/about-us');
    expect(hrefs()).toContain('/careers');
  });

  it('links to the vendor and courier journeys', () => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.footer-col a'))
      .map(a => (a as HTMLElement).textContent?.trim());

    expect(labels).toContain('How to become a vendor');
    expect(labels).toContain('How to become a courier');
  });

  it('renders all five social platforms', () => {
    const socials = Array.from(fixture.nativeElement.querySelectorAll('.socials a'));
    expect(socials.length).toBe(5);

    const labels = socials.map(a => (a as HTMLElement).getAttribute('aria-label'));
    expect(labels).toEqual(['Instagram', 'Facebook', 'X', 'TikTok', 'YouTube']);
  });

  it('gives every social link an accessible name and a hidden glyph', () => {
    Array.from(fixture.nativeElement.querySelectorAll('.socials a')).forEach(a => {
      const link = a as HTMLAnchorElement;
      expect(link.getAttribute('aria-label')).toBeTruthy();
      expect(link.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('opens social links safely in a new tab', () => {
    Array.from(fixture.nativeElement.querySelectorAll('.socials a')).forEach(a => {
      expect((a as HTMLAnchorElement).getAttribute('target')).toBe('_blank');
      expect((a as HTMLAnchorElement).getAttribute('rel')).toContain('noopener');
    });
  });

  it('uses the configured social URLs', () => {
    const urls = Array.from(fixture.nativeElement.querySelectorAll('.socials a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(urls).toEqual(SOCIAL_LINKS.map(s => s.url));
  });

  it('keeps the wordmark italic in the legal line', () => {
    expect(fixture.nativeElement.querySelector('.footer-legal .footer-wordmark').textContent.trim())
      .toBe('Foodie Inc');
  });
});
