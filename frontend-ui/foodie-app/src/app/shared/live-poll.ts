import { EMPTY, Observable, concat, defer, fromEvent, of, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

/** How often the owner dashboard re-checks for new orders. */
export const ORDER_POLL_INTERVAL_MS = 15_000;

/**
 * Emits immediately and then every `periodMs`, but only while the document is
 * visible.
 *
 * A backgrounded tab stops polling entirely, so a kitchen screen left open
 * overnight is not hammering the API or burning a laptop battery. When the tab
 * comes back it emits straight away rather than waiting out the interval, so
 * whoever just walked back to the counter sees the current queue immediately.
 *
 * Callers are responsible for unsubscribing; pair it with takeUntilDestroyed.
 */
export function whileVisible(periodMs: number, doc: Document): Observable<void> {
  const visible$ = defer(() =>
    concat(
      of(doc.visibilityState === 'visible'),
      fromEvent(doc, 'visibilitychange').pipe(map(() => doc.visibilityState === 'visible'))
    )
  ).pipe(distinctUntilChanged());

  return visible$.pipe(
    switchMap(visible => (visible ? timer(0, periodMs) : EMPTY)),
    map(() => undefined)
  );
}
