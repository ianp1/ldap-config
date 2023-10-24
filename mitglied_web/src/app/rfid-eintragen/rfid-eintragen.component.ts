import { Component, OnInit, Inject, ViewChild } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { UntypedFormGroup, UntypedFormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';

@Component({
  selector: 'rfid-vergeben',
  templateUrl: './rfid-eintragen.component.html',
  styleUrls: ['./rfid-eintragen.component.scss']
})
export class RfidEintragenComponent implements OnInit {
  loginForm: UntypedFormGroup;

  userSelected : any;

  showRfidWarning : boolean = false;

  searching:boolean = false;
  users:any = [];

  @ViewChild('usersearch', {static: false})
  userSearch;

  constructor(public dialog: MatDialog, private appComponent:AppComponent,
              private http:HttpClient, private formBuilder: UntypedFormBuilder,
              private loginService:LoginService) { }

  initForm() {
    this.loginForm = this.formBuilder.group({
      eingewiesener: [''],
      rfid: ['', [Validators.required, this.regexValidator(/^(([0-9a-fA-F]{1,2}[\_\ ]){3}[0-9a-fA-F]{1,2}|[0-9a-fA-F]{4,8}|(([0-9a-fA-F]{1,2}[\_\ ]){6}[0-9a-fA-F]{1,2}))$/im)]]
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
    console.log(this.loginForm.value['rfid']);
    console.log(this.appComponent.sanitize(this.loginForm.value['rfid']));
    console.log(updateRfid);
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
      console.log(user.rfid);
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
            "</ul>"+
            "in der neuen Karte ein und werfe die <b>Kosten (2€)</b> in die vorgesehene Kasse",
          }
        });
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
          this.userSearch.select();
        });
      }, error => {

      });
  }

  get rfid() {
    return this.loginForm.get('rfid');
  }

  regexValidator(reg: RegExp): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const forbidden = reg.test(control.value);
      console.log("regex validator: ", forbidden);
      return forbidden ? null : {'forbiddenName': {value: control.value}};
    };
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
