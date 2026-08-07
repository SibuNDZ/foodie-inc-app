import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SmartImage } from '../../shared/smart-image/smart-image';
import { ImageKey, imageUrl, primaryImage } from '../../../../assets/images/manifest';

export interface CuisineTile {
  readonly key: string;
  readonly label: string;
  readonly image: string;
  readonly alt: string;
  readonly query: string;
}

const CUISINES: ReadonlyArray<{ key: ImageKey; label: string; query: string }> = [
  { key: 'burgers', label: 'Burgers', query: 'burger' },
  { key: 'pizza', label: 'Pizza', query: 'pizza' },
  { key: 'sushi', label: 'Sushi', query: 'sushi' },
  { key: 'thai', label: 'Thai', query: 'thai' },
  { key: 'chinese', label: 'Chinese', query: 'chinese' },
  { key: 'brunch', label: 'Brunch', query: 'brunch' },
  { key: 'dessert', label: 'Dessert', query: 'dessert' },
  { key: 'grocery', label: 'Groceries', query: 'grocery' }
];

export const CUISINE_TILES: readonly CuisineTile[] = CUISINES.map(c => {
  const photo = primaryImage(c.key);
  return {
    key: c.key,
    label: c.label,
    image: imageUrl(photo, 480),
    alt: photo.alt,
    query: c.query
  };
});

/**
 * Horizontal, scroll-snapping strip of cuisine tiles.
 *
 * A strip rather than a carousel: every category is reachable by scrolling
 * instead of waiting out a rotation, which is how the category rows on the big
 * delivery apps work. It is a plain scroll container, so keyboard, trackpad,
 * touch and screen-reader navigation all come for free.
 */
@Component({
  selector: 'app-cuisine-strip',
  imports: [RouterLink, SmartImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuisine-strip.html',
  styleUrl: './cuisine-strip.scss'
})
export class CuisineStrip {
  protected readonly tiles = CUISINE_TILES;
}
