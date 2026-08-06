import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AboutUs } from './about-us';

describe('AboutUs', () => {
  let component: AboutUs;
  let fixture: ComponentFixture<AboutUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUs, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a single top-level heading', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
  });

  it('routes on to the vendor, courier and careers journeys', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toContain('/partner-with-us');
    expect(hrefs).toContain('/become-a-driver');
    expect(hrefs).toContain('/careers');
  });
});
