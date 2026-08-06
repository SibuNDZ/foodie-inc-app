import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { AuthPrompt, POST_AUTH_DESTINATION } from './auth-prompt';
import { AuthService } from '../../../services/auth';

describe('AuthPrompt', () => {
  let fixture: ComponentFixture<AuthPrompt>;

  const dialog = () => fixture.nativeElement.querySelector('.dialog');
  const button = (text: string): HTMLButtonElement =>
    Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find(b => (b as HTMLElement).textContent?.trim() === text) as HTMLButtonElement;

  /** afterNextRender only fires once the fixture is stable. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const create = async (authenticated: boolean) => {
    await TestBed.configureTestingModule({
      imports: [AuthPrompt, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    spyOn(TestBed.inject(AuthService), 'isAuthenticated').and.returnValue(authenticated);

    fixture = TestBed.createComponent(AuthPrompt);
    await settle();
  };

  afterEach(() => TestBed.resetTestingModule());

  it('shows the dialog to a signed-out visitor', async () => {
    await create(false);
    expect(dialog()).toBeTruthy();
  });

  it('stays hidden for a signed-in visitor', async () => {
    await create(true);
    expect(dialog()).toBeNull();
  });

  it('exposes the dialog pattern to assistive tech', async () => {
    await create(false);
    const el = dialog();

    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('aria-labelledby')).toBe('auth-prompt-title');
    expect(el.getAttribute('aria-describedby')).toBe('auth-prompt-body');
    expect(fixture.nativeElement.querySelector('#auth-prompt-title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#auth-prompt-body')).toBeTruthy();
  });

  it('sends sign-up through to registration with a return url', async () => {
    await create(false);
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    button('Create an account').click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(['/register'], {
      queryParams: { returnUrl: POST_AUTH_DESTINATION }
    });
    expect(dialog()).toBeNull();
  });

  it('sends sign-in through to login with a return url', async () => {
    await create(false);
    const spy = spyOn(TestBed.inject(Router), 'navigate');

    button('Sign in').click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: POST_AUTH_DESTINATION }
    });
  });

  it('closes on the browse-without-an-account escape hatch', async () => {
    await create(false);

    button('Browse without an account').click();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
  });

  it('closes on Escape', async () => {
    await create(false);

    dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(dialog()).toBeNull();
  });

  it('closes when the backdrop is clicked', async () => {
    await create(false);

    fixture.nativeElement.querySelector('.backdrop').click();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
  });

  it('keeps a click inside the dialog from closing it', async () => {
    await create(false);

    dialog().click();
    fixture.detectChanges();

    expect(dialog()).toBeTruthy();
  });

  it('moves focus into the dialog when it opens', async () => {
    await create(false);
    expect(dialog().contains(document.activeElement)).toBeTrue();
  });

  it('wraps Tab from the last control back to the first', async () => {
    await create(false);

    const focusables = Array.from(dialog().querySelectorAll('button')) as HTMLElement[];
    const last = focusables[focusables.length - 1];
    last.focus();

    dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(focusables[0]);
  });

  it('wraps Shift+Tab from the first control back to the last', async () => {
    await create(false);

    const focusables = Array.from(dialog().querySelectorAll('button')) as HTMLElement[];
    focusables[0].focus();

    dialog().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });
});
