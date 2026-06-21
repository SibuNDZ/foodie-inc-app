import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';

import { DishManagement } from './dish-management';

describe('DishManagement', () => {
  let component: DishManagement;
  let fixture: ComponentFixture<DishManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishManagement, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ToastrService,
          useValue: {
            success: () => undefined,
            error: () => undefined
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DishManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
