import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-eigene-einweisungen',
  templateUrl: './eigene-einweisungen.component.html',
  styleUrls: ['./eigene-einweisungen.component.sass']
})
export class EigeneEinweisungenComponent implements OnInit {

  constructor(private appComponent:AppComponent) { }

  ngOnInit() {
    this.appComponent.title = "Eigene Einweisungen einsehen"
  }

}
