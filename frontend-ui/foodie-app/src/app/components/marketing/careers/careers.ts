import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Where speculative applications go. Replace with a real careers inbox or ATS link. */
export const CAREERS_ENQUIRY_ADDRESS = 'careers@foodieapp.co.za';

@Component({
  selector: 'app-careers',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './careers.html',
  styleUrl: './careers.scss'
})
export class Careers {
  protected readonly careersAddress = CAREERS_ENQUIRY_ADDRESS;
  protected readonly mailto = `mailto:${CAREERS_ENQUIRY_ADDRESS}?subject=${encodeURIComponent('Speculative application')}`;
}
