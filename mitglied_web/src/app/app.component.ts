import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { environment } from '../environments/environment';

import { HostListener } from '@angular/core';

import { LoginService } from './login/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  url_base: string = environment.url_base;

  userActivity;
  userTimeout;
  userTimeoutCounter = 0;
  userInactive = true;

  constructor(private loginService:LoginService) {
    this.setInactivity();
  }

  setInactivity() {
    this.userInactive = false;
    clearTimeout(this.userActivity);
    clearTimeout(this.userTimeout);
    this.userActivity = setTimeout(() => {
      console.info("inactive! ");
      if (this.loginService.password != '' || this.loginService.username != '') {
        this.userInactive = true;
        this.setInactivityTimeout();
      } else {
        console.log("nothing set, delaying");
        this.setInactivity();
      }
    }, 30000);
  }

  setInactivityTimeout() {
    clearTimeout(this.userActivity);
    clearTimeout(this.userTimeout);
    this.userTimeoutCounter = 30;
    this.userTimeout = setTimeout(()=>this.countTimeout(), 1000);
  }

  countTimeout() {
    this.userTimeoutCounter --;
    if (this.userTimeoutCounter <= 0) {
      window.location.reload();
    } else {
      clearTimeout(this.userTimeout);
      this.userTimeout = setTimeout(()=>this.countTimeout(), 1000);
    }
  }

  @HostListener('window:mousemove') refreshUserState() {
    clearTimeout(this.userActivity);
    clearTimeout(this.userTimeout);
    this.setInactivity();
  }

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
