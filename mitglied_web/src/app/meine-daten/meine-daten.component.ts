import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { AppComponent } from '../app.component';
import { LoginService } from '../login/login.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SuccessDialog } from '../success-dialog/success-dialog';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'meine-daten',
  templateUrl: './meine-daten.component.html',
  styleUrls: ['./meine-daten.component.scss']
})
export class MeineDatenComponent implements OnInit {

  dataForm: FormGroup;
  constructor(
    private formBuilder:FormBuilder, 
    private appComponent:AppComponent, 
    private loginService:LoginService,
    private http:HttpClient,
    public dialog:MatDialog
  ) { }

  initForm() {
    this.dataForm = this.formBuilder.group({
       //
       vorname: [{value:'', disabled: true}],
       nachname: [{value:'', disabled: true}],
       geburtsdatum: [{value:'', disabled: true}],
       //
       plz: [''],
       ort: [''],
       strasse: [''],
       //
       email: [''],
       telefon: [''],
       notfallkontakt: [''],
       //
       discordName: ['']
    });
  }

  ngOnInit() {
    this.initForm();


    this.loginService.valuesChanged.subscribe(model => {
      if (model) {
        this.datenPrefil();
      }
    });
  }

  datenPrefil() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Mitglied/'+user, {
      headers: headers,
      params: params
    }).subscribe(data => {
      console.log("successfull request, data is ", data);
      this.dataForm.patchValue({
        vorname: data['vorname'],
        nachname: data['nachname'],
        geburtsdatum: this.appComponent.reformatLDAPDate(data['geburtsdatum']),

        plz: data['plz'],
        ort: data['ort'],
        strasse: data['strasse'],

        email: data['email'],
        telefon: data['telefon'],
        notfallkontakt: data['notfallkontakt'],

        discordName: data['discordName']
      });
    });
  }

  datenSpeichern() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var values = {};
    Object.keys(this.dataForm.controls).forEach(key=> {
      var value = this.appComponent.sanitize(this.dataForm.value[key]);
      if (key == "geburtsdatum") {
        if (value != "") {
          value = this.appComponent.formatLDAPDate(value);
        }
      }

      if (key != "username" && key != "password"){
        values[key]=value;
      }
    });
    values["author_user"] = user;
    values["author_password"] = passw;

    this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Person/'+user, values).subscribe(data=>{
      if (data) {
        const dialogRef = this.dialog.open(SuccessDialog);
        dialogRef.afterClosed().subscribe(data => {
          this.initForm();
          this.datenPrefil();
        });
      }
    }, error => {
      //400: Fehlende Daten
      //Sonst: Anderer Fehler
      if (error.status === 400) {
        let dialogRef = this.dialog.open(SuccessDialog, {
          data : {
            icon:"error",
            icon_class: "iconError",
            customText : "Die Anfrage konnte nicht ausgeführt werden. Wurden alle Pflichtfelder ausgefüllt?",
            title: "Fehler"
          }
        });
      }
    });
  }

}
