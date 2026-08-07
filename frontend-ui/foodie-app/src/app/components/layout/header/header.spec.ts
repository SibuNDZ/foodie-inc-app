import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';

import { Header } from './header';
import { AuthService } from '../../../services/auth';
import { UserRole } from '../../../models';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let authenticated: ReturnType<typeof signal<boolean>>;
  let currentUser: ReturnType<typeof signal<any>>;

  const navHrefs = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.nav-links a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') ?? '');

  const menuHrefs = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.account-menu a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') ?? '');

  const avatarBtn = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.avatar-btn');

  const openAccountMenu = () => {
    avatarBtn().click();
    fixture.detectChanges();
  };

  const create = async (user: any = null) => {
    authenticated = signal(!!user);
    currentUser = signal(user);

    await TestBed.configureTestingModule({
      imports: [Header, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    const auth = TestBed.inject(AuthService);
    Object.defineProperty(auth, 'isAuthenticated', { value: authenticated });
    Object.defineProperty(auth, 'currentUser', { value: currentUser });

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  it('shows the logo mark beside the italic wordmark', async () => {
    await create();
    const brand = fixture.nativeElement.querySelector('.brand');

    expect(brand.querySelector('app-logo-mark')).toBeTruthy();
    expect(brand.querySelector('.brand-wordmark').textContent.trim()).toBe('Foodie Inc');
  });

  it('keeps the primary nav to the four marketing destinations', async () => {
    await create({ username: 'doc.ndz', role: UserRole.ADMIN });

    expect(navHrefs()).toEqual([
      '/restaurants', '/corporate-orders', '/become-a-driver', '/partner-with-us'
    ]);
  });

  it('offers log in and sign up when signed out', async () => {
    await create();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.auth-actions .btn'))
      .map(a => (a as HTMLElement).textContent?.trim());

    expect(labels).toEqual(['Log in', 'Sign up']);
    expect(fixture.nativeElement.querySelector('.avatar-btn')).toBeNull();
  });

  it('derives avatar initials from a dotted username', async () => {
    await create({ username: 'doc.ndz', role: UserRole.CUSTOMER });
    expect(fixture.nativeElement.querySelector('.avatar').textContent.trim()).toBe('DN');
  });

  it('derives avatar initials from a single-word username', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    expect(fixture.nativeElement.querySelector('.avatar').textContent.trim()).toBe('BO');
  });

  it('keeps the account menu closed until asked', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });

    expect(avatarBtn().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.account-menu')).toBeNull();
  });

  it('exposes the dropdown pattern to assistive tech', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    openAccountMenu();

    expect(avatarBtn().getAttribute('aria-expanded')).toBe('true');
    expect(avatarBtn().getAttribute('aria-haspopup')).toBe('menu');
    expect(avatarBtn().getAttribute('aria-controls')).toBe('account-menu');

    const menu = fixture.nativeElement.querySelector('.account-menu');
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('id')).toBe('account-menu');
  });

  it('puts a customer only in front of their own orders', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    openAccountMenu();

    expect(menuHrefs()).toEqual(['/orders']);
  });

  it('adds the restaurant link for an owner', async () => {
    await create({ username: 'mama.thandi', role: UserRole.RESTAURANT_OWNER });
    openAccountMenu();

    expect(menuHrefs()).toContain('/owner/dashboard');
  });

  it('adds the delivery worklist for a driver', async () => {
    await create({ username: 'dispatch.driver', role: UserRole.DELIVERY_PERSON });
    openAccountMenu();

    expect(menuHrefs()).toContain('/driver/deliveries');
  });

  it('adds both admin queues for an admin', async () => {
    await create({ username: 'doc.ndz', role: UserRole.ADMIN });
    openAccountMenu();

    expect(menuHrefs()).toContain('/admin');
    expect(menuHrefs()).toContain('/admin/restaurants/pending');
  });

  it('keeps role links out of the primary nav', async () => {
    await create({ username: 'doc.ndz', role: UserRole.ADMIN });

    expect(navHrefs()).not.toContain('/admin');
    expect(navHrefs()).not.toContain('/orders');
  });

  it('closes the account menu on Escape', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    openAccountMenu();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu')).toBeNull();
  });

  it('closes the account menu when the page is clicked', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    openAccountMenu();

    document.body.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu')).toBeNull();
  });

  it('leaves the menu open when clicking inside it', async () => {
    await create({ username: 'bonke', role: UserRole.CUSTOMER });
    openAccountMenu();

    fixture.nativeElement.querySelector('.account-menu').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-menu')).toBeTruthy();
  });

  it('starts with the mobile menu closed and toggles it', async () => {
    await create();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.nav-toggle');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.collapsible').classList).toContain('open');
  });
});
