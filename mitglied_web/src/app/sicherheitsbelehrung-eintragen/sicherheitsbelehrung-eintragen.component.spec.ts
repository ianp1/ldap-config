import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SicherheitsbelehrungEintragenComponent } from './sicherheitsbelehrung-eintragen.component';

describe('SicherheitsbelehrungEintragenComponent', () => {
  let component: SicherheitsbelehrungEintragenComponent;
  let fixture: ComponentFixture<SicherheitsbelehrungEintragenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SicherheitsbelehrungEintragenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SicherheitsbelehrungEintragenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
