import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { LoginService } from '../login/login.service';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { SuccessDialog } from '../success-dialog/success-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'staffeleinweisung',
  templateUrl: './staffeleinweisung.component.html',
  styleUrls: ['./staffeleinweisung.component.scss']
})
export class StaffeleinweisungComponent implements OnInit {

  constructor(private appComponent:AppComponent, private loginService:LoginService,
            private http:HttpClient, private formBuilder: UntypedFormBuilder, private dialog: MatDialog) { }

  maschinen:any;
  userSelected: any;
  loginForm: UntypedFormGroup;


  get loginControls() { return this.loginForm.controls; }

  ngOnInit() {
    //this.updateMachines();
    this.loginService.valuesChanged.subscribe(model => {
      if (model) {
        this.updateMachines();
      }
    });
    this.initForm();
  }

  updateMachines() {
    var headers = new HttpHeaders();
    var params = new HttpParams();
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    params = params.append('author_user', user);
    params = params.append('author_password', passw);
    params = params.append('filter', "tiered");

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Maschinen', {
      headers:headers,
      params:params
    }).subscribe(data => {
      this.maschinen = data;
    });
  }

  initForm() {
    var username = "";
    var password = "";

    if (typeof this.loginForm !== 'undefined') {
      username = this.loginForm.value["username"];
      password = this.loginForm.value["password"];
    }

    this.loginForm = this.formBuilder.group({
      username: [username],
      password: [password],
      maschine: [],
      eingewiesener: [],
      aktiviert: [],
      kommentar: [],
    });
  }

  selectUser(userEvent) {
    this.userSelected = userEvent;
    if (this.userSelected) {
      var headers = new HttpHeaders();
      var params = new HttpParams();
      var user = this.appComponent.sanitize(this.loginService.username);
      var passw = this.appComponent.sanitize(this.loginService.password);

      var geraet = this.appComponent.encodeURL(this.appComponent.sanitize(
              this.loginForm.value["maschine"]));
      var searchedUser = userEvent.dn;

      params = params.append('author_user', user);
      params = params.append('author_password', passw);

      this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Staffeleinweisung/'+geraet+'/'+searchedUser, {
        headers: headers,
        params: params
      }).subscribe(data => {
        console.log(data);
        this.loginForm.patchValue({
          "kommentar":data['kommentar'],
          "aktiviert":(data['aktiviert']==='TRUE')
        });
      });
    }
  }

  updateEntry() {
    if (this.userSelected) {
      var params = new HttpParams();
      var user = this.appComponent.sanitize(this.loginService.username);
      var passw = this.appComponent.sanitize(this.loginService.password);

      var geraet = this.appComponent.encodeURL(this.appComponent.sanitize(
              this.loginForm.value["maschine"]));
      var searchedUser = this.userSelected.dn;

      params = params.append('author_user', user);
      params = params.append('author_password', passw);
      params = params.append('aktiviert', this.loginForm.value["aktiviert"]);
      params = params.append('kommentar', this.loginForm.value["kommentar"]);

      this.http.post(this.appComponent.url_base+'api/v1.0/index.php/Staffeleinweisung/'+geraet+'/'+searchedUser, params).subscribe(data => {
        var dialogRef = this.dialog.open(SuccessDialog);
          dialogRef.afterClosed().subscribe(data => {
            this.initForm();
          });
      });
    }
  }
}
