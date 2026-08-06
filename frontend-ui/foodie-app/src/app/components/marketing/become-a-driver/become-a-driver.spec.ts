import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { BecomeADriver } from './become-a-driver';

describe('BecomeADriver', () => {
  let component: BecomeADriver;
  let fixture: ComponentFixture<BecomeADriver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BecomeADriver, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BecomeADriver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the courier pitch heading', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('schedule');
  });

  it('sends the primary CTA into sign-up', () => {
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toContain('/register');
  });

  it('explains that courier access is granted after verification', () => {
    const steps = fixture.nativeElement.querySelector('.steps').textContent;
    expect(steps).toContain('verifies');
  });
});
