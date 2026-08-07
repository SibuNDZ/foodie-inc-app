import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    // The nested carousel asks for real dish photos once it renders.
    httpMock.match(r => r.url.endsWith('/dishes/showcase')).forEach(r => r.flush([]));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the hero, cuisine strip, promo and download sections', () => {
    expect(fixture.nativeElement.querySelector('app-hero-search')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-cuisine-strip')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-home-promo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-app-download')).toBeTruthy();
  });

  it('frames the hero with decorative photography that screen readers skip', () => {
    const art = Array.from(fixture.nativeElement.querySelectorAll('.hero-art'));
    expect(art.length).toBe(2);
    art.forEach(el => expect((el as HTMLElement).getAttribute('aria-hidden')).toBe('true'));
  });

  it('mounts the sign-up prompt', () => {
    expect(fixture.nativeElement.querySelector('app-auth-prompt')).toBeTruthy();
  });

  it('does not render the restaurant listing, which lives at /restaurants', () => {
    expect(fixture.nativeElement.querySelector('.restaurants-grid')).toBeNull();
  });

  it('shows the brand lockup below the carousel', () => {
    expect(fixture.nativeElement.querySelector('.brand-lockup-wordmark').textContent.trim())
      .toBe('Foodie Inc');
  });
});
