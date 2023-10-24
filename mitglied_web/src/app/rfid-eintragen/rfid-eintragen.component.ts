import { Component, OnInit, Inject, ViewChild } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';

import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

import { SuccessDialog } from '../success-dialog/success-dialog';

import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';

@Component({
  selector: 'rfid-vergeben',
  templateUrl: './rfid-eintragen.component.html',
  styleUrls: ['./rfid-eintragen.component.scss']
})
export class RfidEintragenComponent implements OnInit {
  loginForm: FormGroup;

  userSelected : User;

  showRfidWarning : boolean = false;

  searching:boolean = false;
  users:User[] = [];

  @ViewChild('usersearch', {static: false})
  userSearch;

  constructor(public dialog: MatDialog, private appComponent:AppComponent,
              private http:HttpClient, private formBuilder: FormBuilder,
              private loginService:LoginService) { }

  initForm() {
    this.loginForm = this.formBuilder.group({
      eingewiesener: [''],
      // eslint-disable-next-line no-useless-escape
      rfid: ['', [Validators.required, this.regexValidator(/^(([0-9a-fA-F]{1,2}[\_\ ]){3}[0-9a-fA-F]{1,2}|[0-9a-fA-F]{4,8}|(([0-9a-fA-F]{1,2}[\_\ ]){6}[0-9a-fA-F]{1,2}))$/im)]]
    });
  }

  ngOnInit() {
    this.initForm();
  }

  enterRfid() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);
    
    const updateRfid = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['rfid']));
    
    console.log(this.loginForm.value['rfid']);
    console.log(this.appComponent.sanitize(this.loginForm.value['rfid']));
    console.log(updateRfid);
    const  headers = new HttpHeaders();
    let params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get<User[]>(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
      headers: headers,
      params: params
    }).subscribe(data => {
      console.log("requested rfid users: ", data);

      //var ar = data as Array<any>;
      const pickDialog = this.dialog.open<DialogRfidExisting, DialogRfidExistingData>(DialogRfidExisting, {
        data : {users:data}
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

  prefillRFID(user:User) {
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

  connectRFID(user:string, passw:string, updateRfid:string, updateUser:User):void {
    const params = {
      'author_user' : user,
      'author_password' : passw
    };
    const updateDN = this.appComponent.encodeURL(this.appComponent.sanitize(updateUser["dn"]));
    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid+'/'+updateDN, params)
      .subscribe(() => {
        const dialogRef = this.dialog.open(SuccessDialog, {
          data : {
            customText : "Der neue Besitzer wurde eingetragen. Bitte trage jetzt<br/>"+
            "<ul>"+
              "<li>Name ("+updateUser["vorname"]+" "+updateUser["nachname"]+")</li>"+
            "</ul>"+
            "in der neuen Karte ein und werfe die <b>Kosten (2€)</b> in die vorgesehene Kasse",
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          this.initForm();
          this.userSearch.select();
        });
      }, () => {

      });
  }

  get rfid() {
    return this.loginForm.get('rfid');
  }

  regexValidator(reg: RegExp): ValidatorFn {
    return (control: AbstractControl): {[key: string]: unknown} | null => {
      const forbidden = reg.test(control.value);
      console.log("regex validator: ", forbidden);
      return forbidden ? null : {'forbiddenName': {value: control.value}};
    };
  }
}


export interface DialogRfidExistingData {
  users:User[];
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
  dataArray: User[];
  interfacestring: DialogRfidExistingColumn[];
  constructor (public dialogRef: MatDialogRef<DialogRfidExisting>,
        @Inject(MAT_DIALOG_DATA) public data: DialogRfidExistingData) {
    this.dataArray = data.users;
    this.interfacestring = this.dataArray.map(obj => {
      return {
        vorname:obj.vorname,
        nachname:obj.nachname,
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
