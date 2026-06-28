import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiBaseUrl;

  async requestPermissionAndSubscribe(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const { publicKey } = await firstValueFrom(
      this.http.get<{ publicKey: string }>(`${this.apiUrl}/push/vapid-public-key`)
    );

    const registration = await navigator.serviceWorker.register('/sw.js');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(publicKey)
    });

    const sub = subscription.toJSON();
    await firstValueFrom(
      this.http.post(`${this.apiUrl}/push/subscribe`, {
        endpoint: sub.endpoint,
        p256dh: sub.keys?.['p256dh'],
        auth: sub.keys?.['auth']
      })
    );
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
  }
}
