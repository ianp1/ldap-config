import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { LdapDatePipe } from '../ldap-date.pipe'
import { DatePipe } from '@angular/common';
import { SuccessDialog } from '../success-dialog/success-dialog';

@Component({
  selector: 'app-einweisungen-eintragen',
  templateUrl: './einweisungen-eintragen.component.html',
  styleUrls: ['./einweisungen-eintragen.component.scss']
})

export class EinweisungenEintragenComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();

  validating: boolean = false;
  valid: boolean = false;

  searching: boolean = false;

  maschinen:any = [];
  users:any = [];

  userSelected: any;

  loginForm: FormGroup;


  constructor(private appComponent:AppComponent, private http:HttpClient, private formBuilder:FormBuilder, public dialog:MatDialog) { }


  get loginControls() { return this.loginForm.controls; }

  initForm() {
    var username = "";
    var password = "";
    var maschine = "";
    var date = new Date();
    var useCurrentDate = true;

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
    this.appComponent.title = "Neue Einweisungen eintragen"

    this.initForm();

    this.userQueryChanged
          .pipe(debounceTime(500))
          .subscribe(
            model => {
              var user = this.appComponent.sanitize(this.loginForm.value['username']);
              var passw = this.appComponent.sanitize(this.loginForm.value['password']);
              var searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['eingewiesener']));

              if (searchTerm != "") {
                this.searching = true;

                var headers = new HttpHeaders();
                var params = new HttpParams();
                params = params.append('author_user', user);
                params = params.append('author_password', passw);

                this.http.get(this.appComponent.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                  headers: headers,
                  params: params
                }).subscribe(data => {

                  this.users=data;
                  this.searching = false;
                }, error => {
                  this.searching = false;

                });
              }
            }
          );
  }

  updateMachines() {

    var headers = new HttpHeaders();
    var params = new HttpParams();
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);

    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Maschinen', {
      headers:headers,
      params:params
    }).subscribe(data => {
      this.maschinen = data;

    });
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  fetchUsers() {
    this.userQueryChanged.next('');
  }

  enterEinweisung() {
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);
    var requestUser = this.appComponent.encodeURL(this.appComponent.sanitize(this.userSelected.dn));
    var machine = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['maschine']));

    var date = this.appComponent.formatLDAPDate(new Date());
    if (!this.loginForm.value['useCurrentDate']) {
      var dateValue = this.appComponent.sanitize(this.loginForm.value['date']);
      if (dateValue == '') {
        return ;
      }
      date = this.appComponent.formatLDAPDate(dateValue);
    }
    var params = {
      'author_user' : user,
      'author_password' : passw
    };

    this.http.post(this.appComponent.url_base+"api/v1.0/index.php/Einweisung/"+requestUser+"/"+machine+"/"+date,
      params
    ).subscribe(data => {
      if (data) {

        var dialogRef;
        if (typeof(data['status'] === 'undefined') && data['status'] !== "not updating") {
          dialogRef = this.dialog.open(SuccessDialog);
          dialogRef.afterClosed().subscribe(data => {
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
              ).subscribe(postData => {
                dialogRef = this.dialog.open(SuccessDialog);
                dialogRef.afterClosed().subscribe(data => {
                  this.initForm();
                });
              });
            }
          });
        }

      }
    }, error => {

    });
  }
}
