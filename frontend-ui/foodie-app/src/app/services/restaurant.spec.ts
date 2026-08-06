import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RestaurantService } from './restaurant';
import { environment } from '../../environments/environment';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  const listUrl = `${environment.apiBaseUrl}/restaurants`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests the plain listing when no options are given', () => {
    service.getAllRestaurants().subscribe();

    const req = httpMock.expectOne(r => r.url === listUrl);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('sends lat and lng when both coordinates are provided', () => {
    service.getAllRestaurants({ lat: -33.9249, lng: 18.4241 }).subscribe();

    const req = httpMock.expectOne(r => r.url === listUrl);
    expect(req.request.params.get('lat')).toBe('-33.9249');
    expect(req.request.params.get('lng')).toBe('18.4241');
    req.flush([]);
  });

  it('omits coordinates when only one of the pair is provided', () => {
    service.getAllRestaurants({ lat: -33.9249 }).subscribe();

    const req = httpMock.expectOne(r => r.url === listUrl);
    expect(req.request.params.has('lat')).toBeFalse();
    expect(req.request.params.has('lng')).toBeFalse();
    req.flush([]);
  });

  it('trims the query and drops it when blank', () => {
    service.getAllRestaurants({ query: '  sushi  ' }).subscribe();
    const withQuery = httpMock.expectOne(r => r.url === listUrl);
    expect(withQuery.request.params.get('query')).toBe('sushi');
    withQuery.flush([]);

    service.getAllRestaurants({ query: '   ' }).subscribe();
    const blank = httpMock.expectOne(r => r.url === listUrl);
    expect(blank.request.params.has('query')).toBeFalse();
    blank.flush([]);
  });

  it('preserves distanceKm from the API response', () => {
    let received: any[] = [];
    service.getAllRestaurants({ lat: -33.9249, lng: 18.4241 }).subscribe(r => (received = r));

    httpMock
      .expectOne(r => r.url === listUrl)
      .flush([{ id: 1, name: 'Long Street Eats', distanceKm: 0.94, active: true, open: true }]);

    expect(received[0].distanceKm).toBe(0.94);
    expect(received[0].isActive).toBeTrue();
  });
});
