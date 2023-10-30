import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'review-banner',
  templateUrl: './review-banner.component.html',
  styleUrls: ['./review-banner.component.scss']
})
export class ReviewBannerComponent implements OnInit {

  showBanner : boolean = true;


  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit() {
  }

}
