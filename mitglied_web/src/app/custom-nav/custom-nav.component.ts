import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppComponent } from '../app.component';

import { ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';


@Component({
  selector: 'custom-nav',
  templateUrl: './custom-nav.component.html',
  styleUrls: ['./custom-nav.component.scss'],
})
export class CustomNavComponent {
  valid = false;
  entry = "start";
  title = "Einweisungsverwaltung";

  titles = {
    "start":"Einweisungsverwaltung",
    "sicherheitsbelehrung":"Neue Sicherheitsbelehrungen eintragen",
    "einweisungen-einsehen":"Einweisungen abfragen",
    "neue-einweisung":"Neue Einweisung eintragen",
    "neues-mitglied":"Neues Mitglied eintragen",
    "rfid-vergeben":"RFID-Karte vergeben",
    "rfid-besitzer-finden":"RFID-Kartenbesitzer finden"
  };

  isHandsetLocal:boolean = false;

  @ViewChild('drawer')
  sidenav : MatSidenav;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );


  constructor(private breakpointObserver: BreakpointObserver,
              public appComponent: AppComponent) {
    this.isHandset$.subscribe(model=> {
      this.isHandsetLocal = model;
    });
  }


    selectEntry(entry: string) {
      this.entry='sicherheitsbelehrung';
      this.title = this.titles[entry];

      if (this.isHandsetLocal) {
        this.sidenav.close();
      }
    }

}
