import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EinweisungenEintragenComponent } from './einweisungen-eintragen.component';

describe('EinweisungenEintragenComponent', () => {
  let component: EinweisungenEintragenComponent;
  let fixture: ComponentFixture<EinweisungenEintragenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EinweisungenEintragenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EinweisungenEintragenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
