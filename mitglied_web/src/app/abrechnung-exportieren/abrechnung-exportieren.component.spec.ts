import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AbrechnungExportierenComponent } from './abrechnung-exportieren.component';

describe('AbrechnungExportierenComponent', () => {
  let component: AbrechnungExportierenComponent;
  let fixture: ComponentFixture<AbrechnungExportierenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbrechnungExportierenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbrechnungExportierenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
