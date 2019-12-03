import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffeleinweisungComponent } from './staffeleinweisung.component';

describe('StaffeleinweisungComponent', () => {
  let component: StaffeleinweisungComponent;
  let fixture: ComponentFixture<StaffeleinweisungComponent>;

  beforeEach(async(() => {
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
