import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Restaurant pitch page. The CTA drops into the existing self-registration flow
 * at /register/restaurant, which creates the owner account and a PENDING_REVIEW
 * restaurant for an admin to approve.
 */
@Component({
  selector: 'app-partner-with-us',
  imports: [RouterLink],
  templateUrl: './partner-with-us.html',
  styleUrl: './partner-with-us.scss'
})
export class PartnerWithUs {}
