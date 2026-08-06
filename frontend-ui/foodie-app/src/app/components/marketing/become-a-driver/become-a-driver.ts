import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Courier pitch page.
 *
 * The CTA lands on the standard sign-up. The API hardcodes new accounts to
 * CUSTOMER, so there is deliberately no role query param here: courier access is
 * granted by an admin after sign-up, and the copy says so rather than implying a
 * self-service driver account that the backend does not support.
 */
@Component({
  selector: 'app-become-a-driver',
  imports: [RouterLink],
  templateUrl: './become-a-driver.html',
  styleUrl: './become-a-driver.scss'
})
export class BecomeADriver {}
