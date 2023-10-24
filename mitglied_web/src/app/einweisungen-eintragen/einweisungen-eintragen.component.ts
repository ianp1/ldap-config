import { Component, OnInit, ViewChild } from '@angular/core';
import { AppComponent } from '../app.component';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { MatDialog } from '@angular/material/dialog';

import { LdapDatePipe } from '../ldap-date.pipe'
import { DatePipe } from '@angular/common';
import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';
import { UserSearchComponent } from '../user-search/user-search.component';
import { Geraet } from '../models/einweisung.model';
import { User } from '../models/user.model';

@Component({
  selector: 'neue-einweisung',
  templateUrl: './einweisungen-eintragen.component.html',
  styleUrls: ['./einweisungen-eintragen.component.scss']
})

export class EinweisungenEintragenComponent implements OnInit {
  searching: boolean = false;

  maschinen:Geraet[] = [];
  users:User[] = [];

  userSelected: User;

  loginForm: UntypedFormGroup;

  @ViewChild('usersearch', {static: false})
  usersearch:UserSearchComponent;


  constructor(private appComponent:AppComponent, private http:HttpClient,
              private formBuilder:UntypedFormBuilder, public dialog:MatDialog,
              private loginService:LoginService ) {
  }


  get loginControls() { return this.loginForm.controls; }

  initForm() {
    let username = "";
    let password = "";
    let maschine = "";
    let date = new Date();
    let useCurrentDate = true;

    if (typeof this.loginForm !== 'undefined') {
      username = this.loginForm.value["username"];
      password = this.loginForm.value["password"];
      maschine = this.loginForm.value["maschine"];
      useCurrentDate = this.loginForm.value["useCurrentDate"];
      date = this.loginForm.value["date"];
    }

    this.loginForm = this.formBuilder.group({
       username: [username],
       password: [password],
       eingewiesener: [''],
       maschine: [maschine],
       useCurrentDate: [useCurrentDate],
       date: [date]
    });
  }

  ngOnInit() {
    this.initForm();

    this.loginService.valuesChanged.subscribe(model => {
      if (model) {
        this.updateMachines();
      }
    });
  }

  updateMachines() {

    const headers = new HttpHeaders();
    let params = new HttpParams();
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get<Geraet[]>(this.appComponent.url_base+'api/v1.0/index.php/Maschinen', {
      headers:headers,
      params:params
    }).subscribe(data => {
      this.maschinen = data;
      console.log("fetched machines: ", data);

    });
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  enterEinweisung() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);
    const requestUser = this.appComponent.encodeURL(this.appComponent.sanitize(this.userSelected.dn));
    const machine = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['maschine']));

    let date = this.appComponent.formatLDAPDate(new Date());
    if (!this.loginForm.value['useCurrentDate']) {
      const dateValue = this.appComponent.sanitize(this.loginForm.value['date']);
      if (dateValue == '') {
        return ;
      }
      date = this.appComponent.formatLDAPDate(dateValue);
    }
    const params = {
      'author_user' : user,
      'author_password' : passw
    };

    this.http.post(this.appComponent.url_base+"api/v1.0/index.php/Einweisung/"+requestUser+"/"+machine+"/"+date,
      params
    ).subscribe(data => {
      if (data) {

        let dialogRef;
        if (typeof(data['status'] === 'undefined') && data['status'] !== "not updating") {
          dialogRef = this.dialog.open(SuccessDialog);
          dialogRef.afterClosed().subscribe(() => {
            this.usersearch.select();
            this.initForm();
          });
        } else {
          dialogRef = this.dialog.open(SuccessDialog, {
            data : {
              icon:"warning",
              icon_class: "iconWarning",
              customText : "Es ist bereits eine Einweisung am "+new DatePipe("de-DE").transform(new LdapDatePipe().transform(data['date']))+" vorhanden. Soll diese überschrieben werden?",
              title: "Achtung",
              confirm: true
            }
          });
          dialogRef.afterClosed().subscribe(data => {
            if (data) {
              params["force"]=true;
              this.http.post(this.appComponent.url_base+"api/v1.0/index.php/Einweisung/"+requestUser+"/"+machine+"/"+date,
                params
              ).subscribe(() => {
                dialogRef = this.dialog.open(SuccessDialog);
                dialogRef.afterClosed().subscribe(() => {
                  this.usersearch.select();
                  this.initForm();
                });
              });
            }
          });
        }

      }
    }, error => {
      console.log("error creating Einweisung: ", error);
    });
  }
}
