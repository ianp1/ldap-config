import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewBannerComponent } from './review-banner.component';

describe('ReviewBannerComponent', () => {
  let component: ReviewBannerComponent;
  let fixture: ComponentFixture<ReviewBannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewBannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
