import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { SuccessDialog } from '../success-dialog/success-dialog';


@Component({
  selector: 'sicherheitsbelehrung',
  templateUrl: './sicherheitsbelehrung-eintragen.component.html',
  styleUrls: ['./sicherheitsbelehrung-eintragen.component.scss']
})
export class SicherheitsbelehrungEintragenComponent implements OnInit {
  validating: boolean = false;
  valid: boolean = false;

  loginForm: FormGroup;
  sicherheitForm: FormGroup;


  get sicherheitControls() { return this.sicherheitForm.controls; }

  constructor(public dialog: MatDialog, private appComponent:AppComponent, private http:HttpClient, private formBuilder : FormBuilder) { }

  initForm() {
    var username = "";
    var password = "";
    var useCurrentDate = true;
    var date = new Date();

    if (typeof this.loginForm !== 'undefined') {
      username = this.loginForm.value["username"];
      password = this.loginForm.value["password"];
    }

    if (typeof this.sicherheitForm !== 'undefined') {
      useCurrentDate = this.sicherheitForm.value["useCurrentDate"];
      date = this.sicherheitForm.value["selectedDate"];
    }

    this.loginForm = this.formBuilder.group({
      username: [username],
      password: [password]
    });

    this.sicherheitForm = this.formBuilder.group({
      vorname: [''],
      nachname: [''],
      geburtsdatum: [''],
      useCurrentDate: [useCurrentDate],
      selectedDate: [date]
    });
  }

  ngOnInit() {
    this.appComponent.title="Neue Sicherheitsbelehrungen eintragen";

    this.initForm();
  }

  checkExistance() {
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);

    var vorname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.value['vorname']));
    var nachname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.value['nachname']));
    var geburtsdatum = this.appComponent.sanitize(this.sicherheitForm.value['geburtsdatum']);

    geburtsdatum = this.appComponent.formatLDAPDate(geburtsdatum);

    if (vorname != '' && nachname != '' && geburtsdatum != '') {
      var headers = new HttpHeaders();
      var params = new HttpParams();
      params = params.append('author_user', user);
      params = params.append('author_password', passw);

      this.http.get(this.appComponent.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum, {
        headers: headers,
        params: params
      })
      .subscribe(data => {
        var ar = data as Array<any>;
        if (ar.length != 0) {
          let pickDialog = this.dialog.open(DialogUserExisting, {
            data : {users:ar, appComponent:this.appComponent}
          })
          pickDialog.afterClosed().subscribe(result => {
            if (result) {
              if (result["createUser"]) {
                this.createUser();
              } else {

                this.updateSicherheitsbelehrung(result["UserDN"]);
              }
            }
          });
        } else {
          this.createUser();
        }
      }, error=> {

      });
    }
  }

  getSelectedDate() {
    if (!this.sicherheitForm.value["useCurrentDate"]) {
      return this.appComponent.formatLDAPDate(this.sicherheitForm.value['selectedDate'])
    } else {
      return this.appComponent.formatLDAPDate(new Date());
    }
  }

  updateSicherheitsbelehrung(DN:string) {
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);

    var date = this.getSelectedDate();

    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Sicherheitsbelehrung/'+this.appComponent.encodeURL(DN)+'/'+this.appComponent.encodeURL(date), {
      author_user: user,
      author_password : passw,
      new_date : date
    }).subscribe(data=>{
      const dialogRef = this.dialog.open(SuccessDialog);
      dialogRef.afterClosed().subscribe(data => {
        this.initForm();
      });
    });
  }

  createUser() {
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);

    var date = this.getSelectedDate();

    var vorname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.value['vorname']));
    var nachname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.value['nachname']));
    var geburtsdatum = this.appComponent.sanitize(this.sicherheitForm.value['geburtsdatum']);

    geburtsdatum = this.appComponent.formatLDAPDate(geburtsdatum);



    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum+'/'+date,
      {
        author_user: user,
        author_password: passw
      })
      .subscribe(data => {
        const dialogRef = this.dialog.open(SuccessDialog, {data:{
          customText:"Die ID des neuen Benutzers ist "+data+"."
        }});
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
        });
      }, error => {

      }
    );

  }
}

export interface DialogUserExistingData {
  users:any[];
  appComponent: AppComponent;
}

export interface DialogUserExistingColumn {
  vorname: string;
  nachname: string;
  uid: string;
  dn: string;
  sicherheitsbelehrung: string;
}

@Component({
  selector: 'dialog-user-existing',
  templateUrl: 'dialog-user-existing.html',
  styleUrls: ['./dialog-user-existing.scss']
})
export class DialogUserExisting {
  displayedColumns: string[] = ['Name', 'UID', 'Sicherheitsbelehrung', 'DN'];
  dataArray: any[];
  interfacestring: DialogUserExistingColumn[];
  constructor (public dialogRef: MatDialogRef<DialogUserExisting>,
        @Inject(MAT_DIALOG_DATA) public data: DialogUserExistingData) {


    this.dataArray = data.users as any[];
    this.interfacestring = this.dataArray.map(obj => {
      return {
        vorname:obj.vorname,
        nachname:obj.nachname,
        uid:obj.uid,
        dn:obj.dn,
        sicherheitsbelehrung: obj.sicherheitsbelehrung
      };
    });
  }

  updateUser(DN:string) {
    this.dialogRef.close({
      createUser: false,
      UserDN:DN
    });
  }

  createUser() {
    this.dialogRef.close({
      createUser: true,
      UserDN: ""
    });
  }

  abort() {
    this.dialogRef.close(false);
  }

}
