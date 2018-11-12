import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-mitglied-eintragen',
  templateUrl: './mitglied-eintragen.component.html',
  styleUrls: ['./mitglied-eintragen.component.sass']
})
export class MitgliedEintragenComponent implements OnInit {

  constructor(private appComponent:AppComponent) { }

  ngOnInit() {
    this.appComponent.title = "Neues Mitglied eintragen"
  }

}
