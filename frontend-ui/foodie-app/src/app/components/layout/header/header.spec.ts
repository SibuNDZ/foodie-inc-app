import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  const hrefs = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.nav-links a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the logo mark beside the wordmark', () => {
    const brand = fixture.nativeElement.querySelector('.brand');
    expect(brand.querySelector('app-logo-mark')).toBeTruthy();
    expect(brand.querySelector('.brand-wordmark').textContent.trim()).toBe('Foodie Inc');
  });

  it('exposes the three marketing links to signed-out visitors', () => {
    expect(hrefs()).toContain('/corporate-orders');
    expect(hrefs()).toContain('/become-a-driver');
    expect(hrefs()).toContain('/partner-with-us');
  });

  it('keeps the existing Explore link', () => {
    expect(hrefs()).toContain('/restaurants');
  });

  it('starts with the mobile menu closed', () => {
    const toggle = fixture.nativeElement.querySelector('.nav-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.collapsible').classList).not.toContain('open');
  });

  it('toggles the mobile menu and reflects it in aria-expanded', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.nav-toggle');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.collapsible').classList).toContain('open');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('points the toggle at the collapsible panel for assistive tech', () => {
    const toggle = fixture.nativeElement.querySelector('.nav-toggle');
    const panel = fixture.nativeElement.querySelector('.collapsible');

    expect(toggle.getAttribute('aria-controls')).toBe('primary-navigation');
    expect(panel.getAttribute('id')).toBe('primary-navigation');
    expect(toggle.getAttribute('aria-label')).toBeTruthy();
  });

  it('closes the open menu when a nav link is followed', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.nav-toggle');
    toggle.click();
    fixture.detectChanges();

    const link: HTMLAnchorElement =
      fixture.nativeElement.querySelector('.nav-links a[href="/become-a-driver"]');
    link.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
