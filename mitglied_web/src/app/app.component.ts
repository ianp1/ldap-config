import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Mitgliederverwaltung';

  url_base: string = environment.url_base;

  formatLDAPDate(date:any):string {
    return formatDate(date, 'yyyyMMdd', 'de-DE')+'000000Z'
  }

  reformatLDAPDate(date:string):string {
    return date.substring(0, 4)+"-"+date.substring(4,6)+"-"+date.substring(6,8)+"T00:00:00.000Z";//"2016-01-05T09:05:05.035Z"
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
