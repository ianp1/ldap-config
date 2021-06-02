import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeineDatenComponent } from './meine-daten.component';

describe('MeineDatenComponent', () => {
  let component: MeineDatenComponent;
  let fixture: ComponentFixture<MeineDatenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MeineDatenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeineDatenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
