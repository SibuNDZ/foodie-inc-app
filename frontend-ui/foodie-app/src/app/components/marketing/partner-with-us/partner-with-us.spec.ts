import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PartnerWithUs } from './partner-with-us';

describe('PartnerWithUs', () => {
  let component: PartnerWithUs;
  let fixture: ComponentFixture<PartnerWithUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerWithUs, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerWithUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the restaurant pitch heading', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('kitchen');
  });

  it('sends both CTAs into the existing restaurant self-registration flow', () => {
    const ctas = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'))
      .filter(href => href === '/register/restaurant');

    expect(ctas.length).toBe(2);
  });
});
