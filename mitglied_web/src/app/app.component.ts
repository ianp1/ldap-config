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

  compareLDAPDates(date1:string, date2:string):boolean {
    for (var i = 0; i < 8; i++) {
      if (parseInt(date1[i]) > parseInt(date2[i])) {
        return true;
      }
    }
    return false;
  }

  encodeURL(param:string):string {
    return encodeURI(param+"");
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }
}
