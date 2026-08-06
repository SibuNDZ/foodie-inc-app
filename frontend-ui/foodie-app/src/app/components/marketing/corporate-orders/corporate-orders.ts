import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface EnquiryForm {
  company: string;
  contactName: string;
  email: string;
  teamSize: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where corporate enquiries are sent. */
export const CORPORATE_ENQUIRY_ADDRESS = 'corporate@foodieapp.co.za';

@Component({
  selector: 'app-corporate-orders',
  imports: [FormsModule, RouterLink],
  templateUrl: './corporate-orders.html',
  styleUrl: './corporate-orders.scss'
})
export class CorporateOrders {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly enquiryAddress = CORPORATE_ENQUIRY_ADDRESS;

  protected readonly form = signal<EnquiryForm>({
    company: '',
    contactName: '',
    email: '',
    teamSize: '',
    message: ''
  });

  /** Set once the user has tried to submit, so errors are not shown pre-emptively. */
  protected readonly submitted = signal(false);
  protected readonly sent = signal(false);

  protected readonly errors = computed(() => {
    const { company, contactName, email } = this.form();
    return {
      company: company.trim() ? '' : 'Company name is required.',
      contactName: contactName.trim() ? '' : 'Contact name is required.',
      email: EMAIL_PATTERN.test(email.trim()) ? '' : 'Enter a valid email address.'
    };
  });

  protected readonly isValid = computed(() =>
    Object.values(this.errors()).every(message => !message));

  protected setField<K extends keyof EnquiryForm>(key: K, value: string): void {
    this.form.update(current => ({ ...current, [key]: value }));
  }

  /**
   * There is no enquiries endpoint on the API, so this composes a prefilled mail
   * draft rather than pretending to persist the enquiry.
   */
  protected submit(): void {
    this.submitted.set(true);
    if (!this.isValid()) {
      return;
    }

    const { company, contactName, email, teamSize, message } = this.form();
    const subject = `Corporate ordering enquiry: ${company.trim()}`;
    const body = [
      `Company: ${company.trim()}`,
      `Contact: ${contactName.trim()}`,
      `Email: ${email.trim()}`,
      teamSize.trim() ? `Team size: ${teamSize.trim()}` : null,
      '',
      message.trim()
    ]
      .filter(line => line !== null)
      .join('\n');

    this.openMailDraft(
      `mailto:${CORPORATE_ENQUIRY_ADDRESS}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`
    );

    this.sent.set(true);
  }

  /** Isolated so it can be stubbed in tests and skipped entirely during SSR. */
  protected openMailDraft(href: string): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = href;
    }
  }
}
