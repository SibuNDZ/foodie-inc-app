import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CorporateOrders } from './corporate-orders';

describe('CorporateOrders', () => {
  let component: CorporateOrders;
  let fixture: ComponentFixture<CorporateOrders>;

  const setValue = (name: string, value: string) => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(`[name="${name}"]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () => {
    fixture.nativeElement.querySelector('form')
      .dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateOrders, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CorporateOrders);
    component = fixture.componentInstance;
    // Never let a test hand the browser a real mailto: navigation.
    spyOn(component as any, 'openMailDraft');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the hero heading and an enquiry form', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('office');
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('shows no validation errors before the first submit', () => {
    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(0);
  });

  it('reports missing required fields on submit', () => {
    submit();

    const messages = Array.from(fixture.nativeElement.querySelectorAll('.field-error'))
      .map(el => (el as HTMLElement).textContent?.trim());

    expect(messages.length).toBe(3);
    expect(messages).toContain('Company name is required.');
    expect(messages).toContain('Contact name is required.');
    expect(messages).toContain('Enter a valid email address.');
  });

  it('rejects a malformed email address', () => {
    setValue('company', 'Acme');
    setValue('contactName', 'Thandi');
    setValue('email', 'not-an-email');
    submit();

    const messages = Array.from(fixture.nativeElement.querySelectorAll('.field-error'))
      .map(el => (el as HTMLElement).textContent?.trim());

    expect(messages).toEqual(['Enter a valid email address.']);
  });

  it('marks invalid fields with aria-invalid for assistive tech', () => {
    submit();

    const company = fixture.nativeElement.querySelector('[name="company"]');
    expect(company.getAttribute('aria-invalid')).toBe('true');
  });

  it('confirms once a valid enquiry is submitted', () => {
    setValue('company', 'Acme');
    setValue('contactName', 'Thandi');
    setValue('email', 'thandi@acme.co.za');
    submit();

    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(0);

    const status = fixture.nativeElement.querySelector('.form-status');
    expect(status).toBeTruthy();
    expect(status.getAttribute('role')).toBe('status');
  });

  it('composes a prefilled mail draft with the entered details', () => {
    setValue('company', 'Acme');
    setValue('contactName', 'Thandi');
    setValue('email', 'thandi@acme.co.za');
    submit();

    const href: string = (component as any).openMailDraft.calls.mostRecent().args[0];

    expect(href.startsWith('mailto:corporate@foodieapp.co.za')).toBeTrue();
    expect(decodeURIComponent(href)).toContain('Acme');
    expect(decodeURIComponent(href)).toContain('thandi@acme.co.za');
  });

  it('does not open a mail draft when the form is invalid', () => {
    submit();
    expect((component as any).openMailDraft).not.toHaveBeenCalled();
  });
});
