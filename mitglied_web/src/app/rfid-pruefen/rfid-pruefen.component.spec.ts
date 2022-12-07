import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RfidPruefenComponent } from './rfid-pruefen.component';

describe('RfidPruefenComponent', () => {
  let component: RfidPruefenComponent;
  let fixture: ComponentFixture<RfidPruefenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RfidPruefenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RfidPruefenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
