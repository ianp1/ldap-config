import { Component, OnInit, Inject } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';

@Component({
  selector: 'rfid-vergeben',
  templateUrl: './rfid-eintragen.component.html',
  styleUrls: ['./rfid-eintragen.component.scss']
})
export class RfidEintragenComponent implements OnInit {
  loginForm: FormGroup;

  userSelected : any;

  showRfidWarning : boolean = false;

  searching:boolean = false;
  users:any = [];

  constructor(public dialog: MatDialog, private appComponent:AppComponent,
              private http:HttpClient, private formBuilder: FormBuilder,
              private loginService:LoginService) { }

  initForm() {
    this.loginForm = this.formBuilder.group({
      eingewiesener: [''],
      rfid: ['']
    });
  }

  ngOnInit() {
    this.initForm();
  }

  enterRfid() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);
    var updateUser = this.appComponent.encodeURL(this.appComponent.sanitize(this.userSelected.dn));
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
          this.connectRFID(user, passw, updateRfid, this.userSelected);
        }
      });

      //Schon Nutzer gefunden
    }, error => {
      //404: Kein Nutzer mit diesem RFID
      //Sonst: Anderer Fehler
      if (error.status === 404) {
        this.connectRFID(user, passw, updateRfid, this.userSelected);
      }
      this.searching = false;

    });
  }

  prefillRFID(user:any) {
    this.userSelected = user;
    if (typeof user.rfid !== 'undefined' && user.rfid != '' && user.rfid !== null) {
      this.showRfidWarning = true;

      this.loginForm.patchValue({
        'rfid':user.rfid
      });
    } else {
      this.showRfidWarning = false;
      this.loginForm.patchValue({
        'rfid':''
      });
    }
  }

  connectRFID(user:string, passw:string, updateRfid:string, updateUser:Object):void {
    var params = {
      'author_user' : user,
      'author_password' : passw
    };
    var updateDN = this.appComponent.encodeURL(this.appComponent.sanitize(updateUser["dn"]));
    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid+'/'+updateDN, params)
      .subscribe(data => {
        const dialogRef = this.dialog.open(SuccessDialog, {
          data : {
            customText : "Der neue Besitzer wurde eingetragen. Bitte trage jetzt<br/>"+
            "<ul>"+
              "<li>Name ("+updateUser["vorname"]+" "+updateUser["nachname"]+")</li>"+
              "<li>und ID ("+updateUser["uid"]+")</li>"+
            "</ul>"+
            "in der neuen Karte ein und werfe den <b>Pfand (5€)</b> in die vorgesehene Kasse",
          }
        });
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
        });
      }, error => {

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
