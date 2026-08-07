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

  it('strips the hero down to the pills and the search card', () => {
    expect(fixture.nativeElement.querySelector('.hero-art')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hero h1')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hero .hero-sub')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hero .search-shell')).toBeTruthy();
  });

  it('offers the four marketing destinations as pills', () => {
    const pills = Array.from(fixture.nativeElement.querySelectorAll('.hero-pill'));

    expect(pills.map(a => (a as HTMLElement).textContent?.trim())).toEqual([
      'Explore', 'Corporate Orders', 'Become a Driver', 'Partner with Us'
    ]);
    expect(pills.map(a => (a as HTMLAnchorElement).getAttribute('href'))).toEqual([
      '/restaurants', '/corporate-orders', '/become-a-driver', '/partner-with-us'
    ]);
  });

  it('places the pills above the search card', () => {
    const hero = fixture.nativeElement.querySelector('.hero');
    const order = Array.from(hero.querySelectorAll('.hero-pills, .search-shell'))
      .map(el => (el as HTMLElement).className.split(' ')[0]);

    expect(order).toEqual(['hero-pills', 'search-shell']);
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
