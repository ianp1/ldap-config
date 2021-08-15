import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AbrechnungExportierenComponent } from './abrechnung-exportieren.component';

describe('AbrechnungExportierenComponent', () => {
  let component: AbrechnungExportierenComponent;
  let fixture: ComponentFixture<AbrechnungExportierenComponent>;

  beforeEach(waitForAsync(() => {
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
