import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SummaryPageComponent } from './summary-page.component';

describe('SummaryPageComponent', () => {
  let component: SummaryPageComponent;
  let fixture: ComponentFixture<SummaryPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SummaryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
