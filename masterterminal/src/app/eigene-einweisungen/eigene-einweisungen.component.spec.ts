import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EigeneEinweisungenComponent } from './eigene-einweisungen.component';

describe('EigeneEinweisungenComponent', () => {
  let component: EigeneEinweisungenComponent;
  let fixture: ComponentFixture<EigeneEinweisungenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EigeneEinweisungenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EigeneEinweisungenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
