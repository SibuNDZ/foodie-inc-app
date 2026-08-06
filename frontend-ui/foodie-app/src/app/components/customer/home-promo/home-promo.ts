import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PromoCard {
  readonly icon: string;
  readonly title: string;
  readonly copy: string;
  readonly cta: string;
  readonly route: string;
}

export const PROMO_CARDS: readonly PromoCard[] = [
  {
    icon: 'fa-solid fa-motorcycle',
    title: 'Become a Driver',
    copy: 'Deliver on your own schedule, get paid per drop and keep every cent of your tips.',
    cta: 'Start driving',
    route: '/become-a-driver'
  },
  {
    icon: 'fa-solid fa-store',
    title: 'Become a Merchant',
    copy: 'List your kitchen, manage your own menu and let us handle the drivers.',
    cta: 'List your restaurant',
    route: '/partner-with-us'
  },
  {
    icon: 'fa-solid fa-briefcase',
    title: 'Corporate Orders',
    copy: 'Feed the whole team on one account, with a single monthly invoice.',
    cta: 'Talk to our team',
    route: '/corporate-orders'
  }
];

@Component({
  selector: 'app-home-promo',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-promo.html',
  styleUrl: './home-promo.scss'
})
export class HomePromo {
  protected readonly cards = PROMO_CARDS;
}
