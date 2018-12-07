import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RfidEintragenComponent } from './rfid-eintragen.component';

describe('RfidEintragenComponent', () => {
  let component: RfidEintragenComponent;
  let fixture: ComponentFixture<RfidEintragenComponent>;

  beforeEach(async(() => {
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
