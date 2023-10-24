import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';

@Component({
  selector: 'neues-mitglied',
  templateUrl: './mitglied-eintragen.component.html',
  styleUrls: ['./mitglied-eintragen.component.scss']
})
export class MitgliedEintragenComponent implements OnInit {

  constructor(private appComponent:AppComponent, private http:HttpClient,
              private formBuilder:FormBuilder, public dialog:MatDialog,
              private loginService:LoginService) { }

  loginForm: FormGroup;
  userSelected: User;
  valid: boolean = false;

  initForm() {
    this.loginForm = this.formBuilder.group({
       neuesMitglied: [''],
       //
       mitgliedschaft: ['ehrenmitgliedschaft'],
       anrede: ['Herr'],
       titel: [''],
       vorname: [''],
       nachname: [''],
       geburtsdatum: [''],
       //
       plz: ['23560'],
       ort: ['Lübeck'],
       strasse: ['abc'],
       //
       email: ['a@b.de'],
       telefon: ['123'],
       notfallkontakt: [''],
       //Nur wenn keine geteilte mitgliedschaft
       iban: ['DE12'],
       bic: ['DE12'],
       kontoinhaber: ['ABC'],
       //Nur wenn keine geteilte mitgliedschaft
       beitragsanpassung: [0.0],
       beitragsanpassungBis: [''],
       //Nur bei geteilter Mitgliedschaft
       teilVon: [''],//TODO
       beginnMitgliedschaft: [''],
       kommentar: ['']
    });
  }

  ngOnInit() {
    this.initForm();
  }

  prefillMitglied(val) {
    console.log("val: ", val);
    this.userSelected = val;
    this.loginForm.patchValue({
      vorname:val['vorname'],
      nachname:val['nachname'],
      geburtsdatum: this.appComponent.reformatLDAPDate(val['geburtstag']),
    });

    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const headers = new HttpHeaders();
    let params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Mitglied/'+val.dn, {
      headers: headers,
      params: params
    }).subscribe(data => {
      let beitragsDate = '';
      if (data['beitragsanpassungBis'] && data['beitragsanpassungBis']!='') {
        beitragsDate = this.appComponent.reformatLDAPDate(data['beitragsanpassungBis']);
      }

      let mitgliedDate = '';
      if (data['beginnMitgliedschaft'] && data['beginnMitgliedschaft'] != '') {
        mitgliedDate = this.appComponent.reformatLDAPDate(data['beginnMitgliedschaft']);
      }

      this.loginForm.patchValue({
        mitgliedschaft: data['mitgliedschaft'],
        anrede: data['anrede'],
        titel: data['titel'],

        plz: data['plz'],
        ort: data['ort'],
        strasse: data['strasse'],

        email: data['email'],
        telefon: data['telefon'],
        notfallkontakt: data['notfallkontakt'],
        
        iban: data['iban'],
        bic: data['bic'],
        kontoinhaber: data['kontoinhaber'],
        beitragsanpassung: data['beitragsanpassung'],
        beitragsanpassungBis: beitragsDate,
        
        beginnMitgliedschaft: mitgliedDate,
        kommentar: data['kommentar']
      });
      console.log("request data: ", data);
    });
  }

  mitgliedEintragen() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const dn = this.appComponent.sanitize(this.userSelected.dn);

    const values = {};
    Object.keys(this.loginForm.controls).forEach(key=> {
      let value = this.appComponent.sanitize(this.loginForm.value[key]);
      if (key == "geburtsdatum" || key == "beitragsanpassungBis" || key == "beginnMitgliedschaft") {
        if (value != "") {
          value = this.appComponent.formatLDAPDate(value);
        }
      }

      if (key != "neuesMitglied" && key != "username" && key != "password"){
        values[key]=value;
      }
    });
    values["author_user"] = user;
    values["author_password"] = passw;

    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Mitglied/'+dn, values).subscribe(data=>{
      if (data) {
        const dialogRef = this.dialog.open(SuccessDialog);
        dialogRef.afterClosed().subscribe(() => {
          this.initForm();
        });
      }
    }, error => {
      //400: Fehlende Daten
      //Sonst: Anderer Fehler
      if (error.status === 400) {
        this.dialog.open(SuccessDialog, {
          data : {
            icon:"error",
            icon_class: "iconError",
            customText : "Die Anfrage konnte nicht ausgeführt werden. Wurden alle Pflichtfelder ausgefüllt?",
            title: "Fehler"
          }
        });
      }
    });
  }
}
