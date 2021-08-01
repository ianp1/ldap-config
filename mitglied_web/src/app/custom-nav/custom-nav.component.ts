import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppComponent } from '../app.component';

import { ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { LocationStrategy } from '@angular/common';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'custom-nav',
  templateUrl: './custom-nav.component.html',
  styleUrls: ['./custom-nav.component.scss'],
})
export class CustomNavComponent {
  valid = false;
  entry = "start";
  title = "Einweisungsverwaltung";

  showMemberMenu = false;
  showTieredMenu = false;

  titles = {
    "start":"Einweisungsverwaltung",
    "sicherheitsbelehrung":"Neue Sicherheitsbelehrungen eintragen",
    "einweisungen-einsehen":"Einweisungen abfragen",
    "neue-einweisung":"Neue Einweisung eintragen",
    "neues-mitglied":"Neues Mitglied eintragen",
    "abrechnung-exportieren":"Abrechnung exportieren",
    "rfid-vergeben":"RFID-Karte vergeben",
    "rfid-besitzer-finden":"RFID-Kartenbesitzer finden",
    "summary-page":"Aktuelle Änderungen",
    "mitglied-teil":"Neuen Mitgliedschaftsteilhaber eintragen"
  };

  isHandsetLocal:boolean = false;

  @ViewChild('drawer', {static: false})
  sidenav : MatSidenav;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );


  constructor(private breakpointObserver: BreakpointObserver,
              public appComponent: AppComponent,
              public location:LocationStrategy, public http:HttpClient,
              public loginService: LoginService) {
    this.isHandset$.subscribe(model=> {
      this.isHandsetLocal = model;
    });

    this.location.onPopState(()=>{
      console.log("back pressed");
      this.selectEntry("start");
      return false;
    });
  }


  selectEntry(entry: string) {
    this.entry=entry;
    this.title = this.titles[entry];

    if (this.isHandsetLocal) {
      this.sidenav.close();
    }
  }

  updateMenuEntries() {
    if (!this.valid) {
      this.showMemberMenu = false;
      this.showTieredMenu = false;
      return;
    }

    var headers = new HttpHeaders();
    var params = new HttpParams();
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Authentifizierung', {
      headers: headers,
      params: params
    }).subscribe(data =>{
      console.log("menu entries request successfull");
      var headers = new HttpHeaders();
      var params = new HttpParams();
      params = params.append('author_user', user);
      params = params.append('author_password', passw);

      this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Mitgliederverwaltung', {
        headers: headers,
        params: params
      }).subscribe(data => {
        this.showMemberMenu = true;
      });

      this.http.get(this.appComponent.url_base+'api/v1.0/index.php/StaffelEinweisung', {
        headers: headers,
        params: params
      }).subscribe(data => {
        this.showTieredMenu = true;
      });
    }, error => {
      console.log("menu entries request permission denied");
      this.showMemberMenu = false;
    });
  }

  logout() {
    window.location.reload();
  }

}
