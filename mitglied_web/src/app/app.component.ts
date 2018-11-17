import { Component } from '@angular/core';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Mitgliederverwaltung';

  formatLDAPDate(date:any):string {
    return formatDate(date, 'yyyyMMdd', 'de-DE')+'000000Z'
  }
}
