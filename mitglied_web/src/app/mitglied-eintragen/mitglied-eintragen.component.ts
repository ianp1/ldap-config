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
       beitragsreduzierung: [0.0],
       ermaessigtBis: [''],
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

    this.userSelected = val;
    this.loginForm.patchValue({
      vorname:val['vorname'],
      nachname:val['nachname'],
      geburtsdatum: this.appComponent.reformatLDAPDate(val['geburtstag']),
    });
  }

  mitgliedEintragen() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var dn = this.appComponent.sanitize(this.userSelected.dn);

    var values = {};
    Object.keys(this.loginForm.controls).forEach(key=> {
      var value = this.appComponent.sanitize(this.loginForm.value[key]);
      if (key == "geburtsdatum" || key == "ermaessigtBis" || key == "beginnMitgliedschaft") {
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
    });
  }
}
