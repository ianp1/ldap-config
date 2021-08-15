import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MitgliedEintragenComponent } from './mitglied-eintragen.component';

describe('MitgliedEintragenComponent', () => {
  let component: MitgliedEintragenComponent;
  let fixture: ComponentFixture<MitgliedEintragenComponent>;

  beforeEach(waitForAsync(() => {
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
