import { Component, OnInit } from '@angular/core';
import { CustomNavComponent } from '../custom-nav/custom-nav.component';

@Component({
  selector: 'start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  constructor(public customNavComponent:CustomNavComponent) {
    
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ngOnInit() {
  }

}
