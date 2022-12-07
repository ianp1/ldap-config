import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RfidEintragenComponent } from './rfid-eintragen.component';

describe('RfidEintragenComponent', () => {
  let component: RfidEintragenComponent;
  let fixture: ComponentFixture<RfidEintragenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RfidEintragenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RfidEintragenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
