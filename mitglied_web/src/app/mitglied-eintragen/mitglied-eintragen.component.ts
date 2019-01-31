import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-mitglied-eintragen',
  templateUrl: './mitglied-eintragen.component.html',
  styleUrls: ['./mitglied-eintragen.component.scss']
})
export class MitgliedEintragenComponent implements OnInit {

  constructor(private appComponent:AppComponent, private http:HttpClient, private formBuilder:FormBuilder) { }

  loginForm: FormGroup;

  ngOnInit() {
    this.appComponent.title = "Neues Mitglied eintragen";

    this.loginForm = this.formBuilder.group({
       username: [''],
       password: [''],
       //
       neuesMitglied: [''],
       //
       mitgliedschaft: ['ehrenmitgliedschaft'],
       anrede: [''],
       titel: [''],
       vorname: [''],//TODO:prefill
       nachname: [''],//TODO:prefill
       geburtsdatum: [''],//TODO:prefill
       //
       plz: [''],
       ort: [''],
       straße: [''],
       //
       email: [''],
       telefon: [''],
       notfallkontakt: [''],
       //Nur wenn keine geteilte mitgliedschaft
       iban: [''],
       bic: [''],
       kontoinhaber: [''],
       //Nur wenn keine geteilte mitgliedschaft
       beitragsreduzierung: [''],
       ermaessigtBis: [''],
       //Nur bei geteilter Mitgliedschaft
       teilVon: ['']
    });
  }

  prefillMitglied(val) {
    console.log("prefillMitglied:", val);
    this.loginForm.patchValue({
      vorname:val['vorname'],
      nachname:val['nachname'],
      geburtsdatum: this.appComponent.reformatLDAPDate(val['geburtstag']),
    });
  }
}
