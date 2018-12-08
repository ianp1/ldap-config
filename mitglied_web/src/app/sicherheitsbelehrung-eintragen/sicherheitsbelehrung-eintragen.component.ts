import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-sicherheitsbelehrung-eintragen',
  templateUrl: './sicherheitsbelehrung-eintragen.component.html',
  styleUrls: ['./sicherheitsbelehrung-eintragen.component.scss']
})
export class SicherheitsbelehrungEintragenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();
  validating: boolean = false;
  valid: boolean = false;

  url_base:string = 'http://127.0.0.1/mitglied_web/';

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  sicherheitForm: FormGroup = new FormGroup({
    vorname: new FormControl(''),
    nachname: new FormControl(''),
    geburtsdatum: new FormControl('')
  })

  constructor(public dialog: MatDialog, private appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title="Neue Sicherheitsbelehrungen eintragen";

    this.txtQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          this.validating = true;
          console.log(this.loginForm.value);
          var user = this.sanitize(this.loginForm.value['username']);
          var passw = this.sanitize(this.loginForm.value['password']);
          var headers = new HttpHeaders();
          var params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.http.get(this.url_base+'api/v1.0/index.php/Authentifizierung', {
            headers: headers,
            params: params
          }).subscribe(data =>{
              console.log("Authentifizierung erfolgreich: "+data);
              this.validating = false;
              this.valid = true;
            },
            error => {
              console.log("fetched error: ", error);
              this.validating = false;
              this.valid = false;
            });
          });
  }

  checkLogin() {
    this.txtQueryChanged.next('');
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  checkExistance() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);

    var vorname = this.encodeURL(this.sanitize(this.sicherheitForm.value['vorname']));
    var nachname = this.encodeURL(this.sanitize(this.sicherheitForm.value['nachname']));
    var geburtsdatum = this.sanitize(this.sicherheitForm.value['geburtsdatum']);

    geburtsdatum = this.appComponent.formatLDAPDate(geburtsdatum);

    if (vorname != '' && nachname != '' && geburtsdatum != '') {
      var headers = new HttpHeaders();
      var params = new HttpParams();
      params = params.append('author_user', user);
      params = params.append('author_password', passw);

      this.http.get(this.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum, {
        headers: headers,
        params: params
      })
        .subscribe(data => {
        var ar = data as Array<any>;
        if (ar.length != 0) {
          let pickDialog = this.dialog.open(DialogUserExisting, {
            data : {users:ar}
          })
          pickDialog.afterClosed().subscribe(result => {
            if (result) {
              if (result["createUser"]) {
                this.createUser();
              } else {
                console.warn("closed modal with ", result);
                this.updateSicherheitsbelehrung(result["UserDN"]);
              }
            }
          });
        } else {
          this.createUser();
        }
      }, error=> {
        console.log("fetched error: ", error);
      });
    }
  }

  updateSicherheitsbelehrung(DN:string) {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);

    var date = this.appComponent.formatLDAPDate(new Date());

    this.http.post(this.url_base+'api/v1.0/index.php/Sicherheitsbelehrung/'+this.encodeURL(DN)+'/'+this.encodeURL(date), {
      author_user: user,
      author_password : passw,
      new_date : date
    }).subscribe(data=>{
      console.log("updated user ", DN, "with response ", data);
    }, error => {
      console.log("error updating user: ", error);
    });
  }

  createUser() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);

    console.log("unformatted date: ", new Date());
    var date = this.appComponent.formatLDAPDate(new Date());
    console.log("current date: ", date);

    var vorname = this.encodeURL(this.sanitize(this.sicherheitForm.value['vorname']));
    var nachname = this.encodeURL(this.sanitize(this.sicherheitForm.value['nachname']));
    var geburtsdatum = this.sanitize(this.sicherheitForm.value['geburtsdatum']);

    geburtsdatum = this.appComponent.formatLDAPDate(geburtsdatum);

    console.warn("creating user ", vorname, nachname, geburtsdatum);

    this.http.post(this.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum+'/'+date,
      {
        author_user: user,
        author_password: passw
      })
      .subscribe(data => {
        console.log("added user with response: ", data);
      }, error => {
        console.warn("got error while creating user: ", error);
      }
    );

  }


  encodeURL(param:string):string {
    return encodeURI(param+"");
  }
}

export interface DialogUserExistingData {
  users:any[];
}

export interface DialogUserExistingColumn {
  vorname: string;
  nachname: string;
  uid: string;
  dn: string;
}

@Component({
  selector: 'dialog-user-existing',
  templateUrl: 'dialog-user-existing.html',
  styleUrls: ['./dialog-user-existing.scss']
})
export class DialogUserExisting {
  displayedColumns: string[] = ['Name', 'UID', 'DN'];
  dataArray: any[];
  interfacestring: DialogUserExistingColumn[];
  constructor (public dialogRef: MatDialogRef<DialogUserExisting>,
        @Inject(MAT_DIALOG_DATA) public data: DialogUserExistingData) {

    console.warn(data);
    this.dataArray = data.users as any[];
    this.interfacestring = this.dataArray.map(obj => {
      return {
        vorname:obj.vorname,
        nachname:obj.nachname,
        uid:obj.uid,
        dn:obj.dn,
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