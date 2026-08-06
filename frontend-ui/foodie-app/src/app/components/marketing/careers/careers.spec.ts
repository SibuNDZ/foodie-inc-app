import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Careers, CAREERS_ENQUIRY_ADDRESS } from './careers';

describe('Careers', () => {
  let component: Careers;
  let fixture: ComponentFixture<Careers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Careers, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Careers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a single top-level heading', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
  });

  it('offers a prefilled mail draft to the careers address', () => {
    const mailtos = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') ?? '')
      .filter(href => href.startsWith('mailto:'));

    expect(mailtos.length).toBe(2);
    mailtos.forEach(href => {
      expect(href).toContain(CAREERS_ENQUIRY_ADDRESS);
      expect(decodeURIComponent(href)).toContain('Speculative application');
    });
  });

  it('links back to the about page', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toContain('/about-us');
  });
});
