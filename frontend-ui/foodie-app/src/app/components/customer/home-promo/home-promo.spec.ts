import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HomePromo } from './home-promo';

describe('HomePromo', () => {
  let component: HomePromo;
  let fixture: ComponentFixture<HomePromo>;

  const cards = () => Array.from(fixture.nativeElement.querySelectorAll('.promo-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePromo, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePromo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders three cards in the requested order', () => {
    const titles = cards().map(c => (c as HTMLElement).querySelector('h3')?.textContent?.trim());
    expect(titles).toEqual(['Become a Driver', 'Become a Merchant', 'Corporate Orders']);
  });

  it('leads the driver card with a motorbike icon', () => {
    const icon = (cards()[0] as HTMLElement).querySelector('.promo-icon i');
    expect(icon?.className).toContain('fa-motorcycle');
  });

  it('links each card to its landing page', () => {
    const hrefs = cards().map(c => (c as HTMLElement).querySelector('a')?.getAttribute('href'));
    expect(hrefs).toEqual(['/become-a-driver', '/partner-with-us', '/corporate-orders']);
  });

  it('hides the decorative icons from assistive tech', () => {
    fixture.nativeElement.querySelectorAll('.promo-icon').forEach((el: Element) => {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('labels the section for assistive tech', () => {
    const section = fixture.nativeElement.querySelector('.promo');
    expect(section.getAttribute('aria-labelledby')).toBe('promo-heading');
    expect(fixture.nativeElement.querySelector('#promo-heading')).toBeTruthy();
  });
});
