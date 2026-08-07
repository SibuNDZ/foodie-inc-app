import { fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Subscription } from 'rxjs';

import { whileVisible, ORDER_POLL_INTERVAL_MS } from './live-poll';

/** Minimal stand-in for Document that lets a test drive visibilitychange. */
class FakeDocument {
  visibilityState: DocumentVisibilityState = 'visible';
  private listeners: Array<() => void> = [];

  addEventListener(_type: string, handler: () => void): void {
    this.listeners.push(handler);
  }

  removeEventListener(_type: string, handler: () => void): void {
    this.listeners = this.listeners.filter(l => l !== handler);
  }

  setVisibility(state: DocumentVisibilityState): void {
    this.visibilityState = state;
    this.listeners.forEach(l => l());
  }

  get listenerCount(): number {
    return this.listeners.length;
  }
}

describe('whileVisible', () => {
  let doc: FakeDocument;
  let ticks: number;
  let sub: Subscription;

  const subscribe = () => {
    sub = whileVisible(1000, doc as unknown as Document).subscribe(() => ticks++);
  };

  beforeEach(() => {
    doc = new FakeDocument();
    ticks = 0;
  });

  afterEach(() => sub?.unsubscribe());

  it('emits straight away when the document is already visible', fakeAsync(() => {
    subscribe();
    tick(0);
    expect(ticks).toBe(1);
    discardPeriodicTasks();
  }));

  it('keeps emitting on the interval', fakeAsync(() => {
    subscribe();
    tick(3000);
    expect(ticks).toBe(4); // immediate + three intervals
    discardPeriodicTasks();
  }));

  it('does not emit while the document starts hidden', fakeAsync(() => {
    doc.visibilityState = 'hidden';
    subscribe();

    tick(5000);
    expect(ticks).toBe(0);
    discardPeriodicTasks();
  }));

  it('stops polling when the tab is backgrounded', fakeAsync(() => {
    subscribe();
    tick(1000);
    const before = ticks;

    doc.setVisibility('hidden');
    tick(10_000);

    expect(ticks).toBe(before);
    discardPeriodicTasks();
  }));

  it('catches up as soon as the tab comes back', fakeAsync(() => {
    subscribe();
    doc.setVisibility('hidden');
    tick(10_000);
    const whileHidden = ticks;

    doc.setVisibility('visible');
    tick(0);

    // No interval wait: the emission lands on the next tick, not 15s later.
    expect(ticks).toBe(whileHidden + 1);
    discardPeriodicTasks();
  }));

  it('ignores repeated events that do not change visibility', fakeAsync(() => {
    subscribe();
    tick(0);
    const before = ticks;

    doc.setVisibility('visible');
    doc.setVisibility('visible');
    tick(0);

    expect(ticks).toBe(before);
    discardPeriodicTasks();
  }));

  it('detaches its listener on unsubscribe', fakeAsync(() => {
    subscribe();
    tick(0);
    expect(doc.listenerCount).toBe(1);

    sub.unsubscribe();
    expect(doc.listenerCount).toBe(0);
    discardPeriodicTasks();
  }));

  it('polls on a sane interval for a kitchen screen', () => {
    expect(ORDER_POLL_INTERVAL_MS).toBe(15_000);
  });
});
