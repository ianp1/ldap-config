import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { FormGroup, FormBuilder } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SuccessDialog } from '../success-dialog/success-dialog';
import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';


@Component({
  selector: 'sicherheitsbelehrung',
  templateUrl: './sicherheitsbelehrung-eintragen.component.html',
  styleUrls: ['./sicherheitsbelehrung-eintragen.component.scss']
})
export class SicherheitsbelehrungEintragenComponent implements OnInit {
  sicherheitForm: FormGroup;


  get sicherheitControls() { return this.sicherheitForm.controls; }

  constructor(public dialog: MatDialog, private appComponent:AppComponent,
              private http:HttpClient, private formBuilder : FormBuilder,
              private loginService:LoginService) {

  }

  initForm() {
    let useCurrentDate = true;
    let  date = new Date();
    let refresh = false;

    if (typeof this.sicherheitForm !== 'undefined') {
      useCurrentDate = this.sicherheitForm.value["useCurrentDate"];
      date = this.sicherheitForm.value["selectedDate"];
      refresh = this.sicherheitForm.value["refresh"];
    }

    this.sicherheitForm = this.formBuilder.group({
      vorname: [''],
      nachname: [''],
      geburtsdatum: [''],
      refresh: [refresh],
      refreshUser: [''],
      useCurrentDate: [useCurrentDate],
      selectedDate: [date]
    });
  }

  ngOnInit() {
    this.initForm();
  }

  checkExistance() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const vorname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.getRawValue()['vorname']));
    const nachname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.getRawValue()['nachname']));
    let geburtsdatum = this.appComponent.sanitize(this.sicherheitForm.getRawValue()['geburtsdatum']);

    console.log("trying to enter sicherheitsbelehrung: ");
    console.log(vorname);
    console.log(nachname);
    console.log(geburtsdatum);


    geburtsdatum = this.appComponent.formatLDAPDate(geburtsdatum);

    if (vorname != '' && nachname != '' && geburtsdatum != '') {
      const headers = new HttpHeaders();
      let params = new HttpParams();
      params = params.append('author_user', user);
      params = params.append('author_password', passw);

      this.http.get<User[]>(this.appComponent.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum, {
        headers: headers,
        params: params
      })
      .subscribe(data => {
        const ar = data;
        if (ar.length != 0) {
          const pickDialog = this.dialog.open<DialogUserExisting, DialogUserExistingData, DialogUserExistingResponse | boolean>(DialogUserExisting, {
            data : {users:ar, appComponent:this.appComponent}
          })
          pickDialog.afterClosed().subscribe(result => {
            console.log("result: ", result);
            console.log(typeof result);
            if (result instanceof DialogUserExistingResponse) {
              console.log("result is DialogUserExistingResponse");
              if (result.createUser) {
                this.createUser();
              } else {
                console.log("update Sicherheitsbelehrung", result.UserDN);
                this.updateSicherheitsbelehrung(result.UserDN);
              }
            }
          });
        } else {
          this.createUser();
        }
      }, error=> {
        console.log("error fetching existing sicherheitsbelehrungen: ", error);
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
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const date = this.getSelectedDate();

    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Sicherheitsbelehrung/'+this.appComponent.encodeURL(DN)+'/'+this.appComponent.encodeURL(date), {
      author_user: user,
      author_password : passw,
      new_date : date
    }).subscribe(()=>{
      const dialogRef = this.dialog.open(SuccessDialog);
      dialogRef.afterClosed().subscribe(() => {
        this.initForm();
      });
    });
  }

  prefill(user) {
    if (user) {
      /*
      let useCurrentDate = false;
      let selectedDate = new Date();
      let refreshUser = '';
      if (typeof this.sicherheitForm !== 'undefined') {
        useCurrentDate = this.sicherheitForm.value["useCurrentDate"];
        selectedDate = this.sicherheitForm.value["selectedDate"];
        refreshUser = this.sicherheitForm.value["refreshUser"];
      }
      this.sicherheitForm = this.formBuilder.group({
        vorname: [{value: user.vorname, disabled: true}],
        nachname: [{value: user.nachname, disabled: true}],
        geburtsdatum: [{value: new Date(this.appComponent.reformatLDAPDate(user.geburtstag)), disabled: true}],
        refresh: [true],
        refreshUser: [refreshUser],
        useCurrentDate: [useCurrentDate],
        selectedDate: [selectedDate]
      });*/


      this.sicherheitForm.patchValue({
        vorname: user.vorname,
        nachname: user.nachname,
        geburtsdatum: new Date(this.appComponent.reformatLDAPDate(user.geburtstag))
      });
      this.sicherheitForm.get('vorname').disable();
      this.sicherheitForm.get('nachname').disable();
      this.sicherheitForm.get('geburtsdatum').disable();
    } else {
      this.sicherheitForm.patchValue({
        vorname: '',
        nachname: '',
        geburtsdatum: ''
      });

      this.sicherheitForm.get('vorname').enable();
      this.sicherheitForm.get('nachname').enable();
      this.sicherheitForm.get('geburtsdatum').enable();
    }
  }

  createUser() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const date = this.getSelectedDate();

    const vorname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.getRawValue()['vorname']));
    const nachname = this.appComponent.encodeURL(this.appComponent.sanitize(this.sicherheitForm.getRawValue()['nachname']));
    let geburtsdatum = this.appComponent.sanitize(this.sicherheitForm.getRawValue()['geburtsdatum']);

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
        dialogRef.afterClosed().subscribe(() => {
          this.initForm();
        });
      }, error => {
        console.log("error creating sicherheitsbelehrung: ", error);
      }
    );

  }
}

export interface DialogUserExistingData {
  users:User[];
  appComponent: AppComponent;
}

export class DialogUserExistingResponse {
  createUser: boolean;
  UserDN: string;
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
  dataArray: User[];
  interfacestring: DialogUserExistingColumn[];
  constructor (public dialogRef: MatDialogRef<DialogUserExisting>,
        @Inject(MAT_DIALOG_DATA) public data: DialogUserExistingData) {


    this.dataArray = data.users;
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
    const response = new DialogUserExistingResponse();
    response.UserDN = DN;
    response.createUser = false;
    this.dialogRef.close(response);
  }

  createUser() {
    const response = new DialogUserExistingResponse();
    response.createUser = true;
    response.UserDN = "";
    this.dialogRef.close(response);
  }

  abort() {
    this.dialogRef.close(false);
  }

}
