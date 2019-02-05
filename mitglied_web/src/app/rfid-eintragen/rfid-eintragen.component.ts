import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { SuccessDialog } from '../success-dialog/success-dialog';

@Component({
  selector: 'app-rfid-eintragen',
  templateUrl: './rfid-eintragen.component.html',
  styleUrls: ['./rfid-eintragen.component.scss']
})
export class RfidEintragenComponent implements OnInit {
  loginForm: FormGroup;
  validating:boolean = false;
  valid:boolean = false;

  searching:boolean = false;
  users:any = [];

  constructor(public dialog: MatDialog, private appComponent:AppComponent, private http:HttpClient, private formBuilder: FormBuilder) { }

  initForm() {
    var username = "";
    var password = "";
    if (typeof this.loginForm !== 'undefined') {
      username = this.loginForm.value["username"];
    }
    if (typeof this.loginForm !== 'undefined') {
      password = this.loginForm.value["password"];
    }
    this.loginForm = this.formBuilder.group({
      username: [username],
      password: [password],
      eingewiesener: [''],
      rfid: ['']
    });
  }

  ngOnInit() {
    this.appComponent.title="RFID-Karte vergeben";

    this.initForm();
  }

  enterRfid() {
    var user = this.appComponent.sanitize(this.loginForm.value['username']);
    var passw = this.appComponent.sanitize(this.loginForm.value['password']);
    var updateUser = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['eingewiesener']));
    var updateRfid = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['rfid']));

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
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
      if (error.status === 404) {
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
    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid+'/'+updateUser, params)
      .subscribe(data => {
        console.log("rfid update successfull: ", data);
        const dialogRef = this.dialog.open(SuccessDialog);
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
        });
      }, error => {
        console.warn("rfid update error: ", error);
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
