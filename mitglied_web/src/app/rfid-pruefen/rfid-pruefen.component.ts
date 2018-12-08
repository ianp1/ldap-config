import { Component, OnInit } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-rfid-pruefen',
  templateUrl: './rfid-pruefen.component.html',
  styleUrls: ['./rfid-pruefen.component.scss']
})
export class RfidPruefenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();
  rfidQueryChanged: Subject<string> = new Subject<string>();

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
    rfid: new FormControl('')
  });

  validating:boolean = false;
  valid:boolean = false;

  url_base:string = 'http://127.0.0.1/mitglied_web/';

  found_users:any;

  constructor(private appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title = "RFID-Tag überprüfen";

    this.rfidQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          var user = this.sanitize(this.loginForm.value['username']);
          var passw = this.sanitize(this.loginForm.value['password']);
          var updateRfid = this.encodeURL(this.sanitize(this.loginForm.value['rfid']));

          var headers = new HttpHeaders();
          var params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.http.get(this.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
            headers: headers,
            params: params
          }).subscribe(data => {
            this.found_users = data;

            console.log("found users: ", this.found_users);
          }, error => {
            this.found_users = null;
            console.warn("error fetching users: ", error);
          });
        })

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

  encodeURL(param:string):string {
    return encodeURI(param+"");
  }

  findUser() {
    this.rfidQueryChanged.next('');
  }

}