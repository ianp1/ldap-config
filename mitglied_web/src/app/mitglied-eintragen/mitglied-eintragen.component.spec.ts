import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MitgliedEintragenComponent } from './mitglied-eintragen.component';

describe('MitgliedEintragenComponent', () => {
  let component: MitgliedEintragenComponent;
  let fixture: ComponentFixture<MitgliedEintragenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MitgliedEintragenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MitgliedEintragenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
