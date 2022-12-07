import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StaffeleinweisungComponent } from './staffeleinweisung.component';

describe('StaffeleinweisungComponent', () => {
  let component: StaffeleinweisungComponent;
  let fixture: ComponentFixture<StaffeleinweisungComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffeleinweisungComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffeleinweisungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
