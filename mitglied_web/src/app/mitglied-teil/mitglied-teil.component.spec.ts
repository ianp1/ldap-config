import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MitgliedTeilComponent } from './mitglied-teil.component';

describe('MitgliedTeilComponent', () => {
  let component: MitgliedTeilComponent;
  let fixture: ComponentFixture<MitgliedTeilComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MitgliedTeilComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MitgliedTeilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
