import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RfidPruefenComponent } from './rfid-pruefen.component';

describe('RfidPruefenComponent', () => {
  let component: RfidPruefenComponent;
  let fixture: ComponentFixture<RfidPruefenComponent>;

  beforeEach(async(() => {
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
