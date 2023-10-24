import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { LoginService } from '../login/login.service';

import { SuccessDialog } from '../success-dialog/success-dialog';
import { User } from '../models/user.model';

@Component({
  selector: 'mitglied-teil',
  templateUrl: './mitglied-teil.component.html',
  styleUrls: ['./mitglied-teil.component.scss']
})
export class MitgliedTeilComponent implements OnInit {


  detailForm: FormGroup;
  inhaber: User;
  neuesMitglied: User;

  constructor(private appComponent:AppComponent, private http:HttpClient,
    private formBuilder:FormBuilder, public dialog:MatDialog,
    private loginService:LoginService) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.detailForm = this.formBuilder.group({
      mitgliedschaftInhaber: [''],
      neuesMitglied: [''],

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
      //Nur bei geteilter Mitgliedschaft
      teilVon: [''],//TODO
      beginnMitgliedschaft: [''],
      kommentar: ['']
   });
  }

  prefillMitglied(val) {
    this.neuesMitglied = val;

    this.detailForm.patchValue({
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

      let mitgliedDate = '';
      if (data['beginnMitgliedschaft'] && data['beginnMitgliedschaft'] != '') {
        mitgliedDate = this.appComponent.reformatLDAPDate(data['beginnMitgliedschaft']);
      }

      this.detailForm.patchValue({
        mitgliedschaft: data['mitgliedschaft'],
        anrede: data['anrede'],
        titel: data['titel'],

        plz: data['plz'],
        ort: data['ort'],
        strasse: data['strasse'],

        email: data['email'],
        telefon: data['telefon'],
        notfallkontakt: data['notfallkontakt'],
        
        beginnMitgliedschaft: mitgliedDate,
        kommentar: data['kommentar']
      });
      console.log("request data: ", data);
    });
  }

  teilhaberEintragen() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const neuMitgliedDn = this.appComponent.sanitize(this.neuesMitglied.dn);
    const inhaberDn = this.appComponent.sanitize(this.inhaber.dn);

    const  values = {};
    Object.keys(this.detailForm.controls).forEach(key=> {
      let value = this.appComponent.sanitize(this.detailForm.value[key]);
      if (key == "geburtsdatum" || key == "beginnMitgliedschaft") {
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

    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Mitgliedteil/'+inhaberDn+'/'+neuMitgliedDn, values).subscribe(data=>{
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
