import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../../services/cart';

@Component({
  selector: 'app-order-success',
  imports: [RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss'
})
export class OrderSuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);

  protected sessionId = '';

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';
    this.cartService.clearCart();
  }
}
