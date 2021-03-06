import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';

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
  userSelected: any;
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

    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Mitglied/'+val.dn, {
      headers: headers,
      params: params
    }).subscribe(data => {
      var beitragsDate = '';
      if (data['beitragsanpassungBis'] && data['beitragsanpassungBis']!='') {
        beitragsDate = this.appComponent.reformatLDAPDate(data['beitragsanpassungBis']);
      }

      var mitgliedDate = '';
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
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var dn = this.appComponent.sanitize(this.userSelected.dn);

    var values = {};
    Object.keys(this.loginForm.controls).forEach(key=> {
      var value = this.appComponent.sanitize(this.loginForm.value[key]);
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
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
        });
      }
    }, error => {
      //400: Fehlende Daten
      //Sonst: Anderer Fehler
      if (error.status === 400) {
        let dialogRef = this.dialog.open(SuccessDialog, {
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
