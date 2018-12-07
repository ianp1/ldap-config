import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-rfid-eintragen',
  templateUrl: './rfid-eintragen.component.html',
  styleUrls: ['./rfid-eintragen.component.scss']
})
export class RfidEintragenComponent implements OnInit {

  txtQueryChanged: Subject<string> = new Subject<string>();
  userQueryChanged: Subject<string> = new Subject<string>();
  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
    eingewiesener: new FormControl(''),
    rfid: new FormControl('')
  });
  validating:boolean = false;
  valid:boolean = false;

  searching:boolean = false;
  users:any = [];
  url_base:string = 'http://127.0.0.1/mitglied_web/';

  constructor(public dialog: MatDialog, private appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title="RFID-Karte vergeben";
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

        this.userQueryChanged
            .pipe(debounceTime(500))
            .subscribe(
              model => {
                var user = this.sanitize(this.loginForm.value['username']);
                var passw = this.sanitize(this.loginForm.value['password']);
                var searchTerm = this.encodeURL(this.sanitize(this.loginForm.value['eingewiesener']));

                if (searchTerm != "") {
                  this.searching = true;

                  var headers = new HttpHeaders();
                  var params = new HttpParams();
                  params = params.append('author_user', user);
                  params = params.append('author_password', passw);

                  this.http.get(this.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                    headers: headers,
                    params: params
                  }).subscribe(data => {
                    console.log("Suche erfolgreich: ", data);
                    this.users=data;
                    this.searching = false;
                  }, error => {
                    this.searching = false;
                    console.log("fetched error: ", error);
                  });
                }
              }
            );
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

  encodeURL(param:string):string {
    return encodeURI(param+"");
  }

  fetchUsers() {
    this.userQueryChanged.next('');
  }

  enterRfid() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);
    var updateUser = this.encodeURL(this.sanitize(this.loginForm.value['eingewiesener']));
    var updateRfid = this.encodeURL(this.sanitize(this.loginForm.value['rfid']));

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
      headers: headers,
      params: params
    }).subscribe(data => {

      var ar = data as Array<any>;
      let pickDialog = this.dialog.open(DialogRfidExisting, {
        data : {users:ar}
      })
      pickDialog.afterClosed().subscribe(result => {
        if (result) {
          this.connectRFID(user, passw, updateRfid, updateUser);
        }
      });

      //Schon Nutzer gefunden
    }, error => {
      //404: Kein Nutzer mit diesem RFID
      //Sonst: Anderer Fehler
      if (error.status === 401) {
        this.connectRFID(user, passw, updateRfid, updateUser);
      }
      this.searching = false;
      console.warn("fetched error: ", error);
    });
  }

  connectRFID(user:string, passw:string, updateRfid:string, updateUser:string):void {
    var params = {
      'author_user' : user,
      'author_password' : passw
    };
    this.http.post(this.url_base+'api/v1.0/index.php/RFID/'+updateRfid+'/'+updateUser, params)
      .subscribe(data => {
        //TODO:Bestägigung einbauen
      }, error => {
        //TODO: Fehlermeldung einbauen
      });
  }
}


export interface DialogRfidExistingData {
  users:any[];
}

export interface DialogRfidExistingColumn {
  vorname: string;
  nachname: string;
  uid: string;
  dn: string;
  geburtstag: string;
}

@Component({
  selector: 'dialog-rfid-existing',
  templateUrl: 'dialog-rfid-existing.html',
  styleUrls: ['./dialog-rfid-existing.scss']
})
export class DialogRfidExisting {
  displayedColumns: string[] = ['Name', 'UID', 'DN'];
  dataArray: any[];
  interfacestring: DialogRfidExistingColumn[];
  constructor (public dialogRef: MatDialogRef<DialogRfidExisting>,
        @Inject(MAT_DIALOG_DATA) public data: DialogRfidExistingData) {

    console.warn(data);
    this.dataArray = data.users as any[];
    this.interfacestring = this.dataArray.map(obj => {
      return {
        vorname:obj.cn,
        nachname:obj.sn,
        uid:obj.uid,
        dn:obj.dn,
        geburtstag:obj.geburtstag
      };
    });
  }

  connectRFID() {

    this.dialogRef.close(true);
  }

  abort() {
    this.dialogRef.close(false);
  }

}
