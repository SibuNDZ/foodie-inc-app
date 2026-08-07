import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { App } from './app';

@Component({ template: '' })
class Blank {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule, RouterTestingModule.withRoutes([
        { path: '', component: Blank },
        { path: 'restaurants', component: Blank }
      ])],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('lets the home route span the window', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.content-area').classList)
      .toContain('content-area--full');
  });

  it('keeps every other route in the centred column', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/restaurants');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.content-area').classList)
      .not.toContain('content-area--full');
  });
});
