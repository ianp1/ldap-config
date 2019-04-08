import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { LoginService } from './login.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();
  validating : boolean = false;
  loginValid : boolean = false;
  pending : boolean = false;

  formGroup : FormGroup;

  @Output()
  validLogin = new EventEmitter<boolean>();

  constructor(public appComponent:AppComponent, public http:HttpClient,
              private formBuilder: FormBuilder, private loginService: LoginService) {

    this.initForm();
  }

  initForm() {
    var username = "";
    var password = "";
    var useCurrentDate = true;
    var date = new Date();

    if (typeof this.formGroup !== 'undefined') {
      username = this.formGroup.value["username"];
      password = this.formGroup.value["password"];
    }

    this.formGroup = this.formBuilder.group({
      username: [username],
      password: [password]
    });
  }


  ngOnInit() {
    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          this.validating = true;
          var user = this.appComponent.sanitize(this.formGroup.value["username"]);
          var passw = this.appComponent.sanitize(this.formGroup.value["password"]);
          var headers = new HttpHeaders();
          var params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Authentifizierung', {
            headers: headers,
            params: params
          }).subscribe(data =>{

              this.validating = false;
              this.loginValid = true;
              this.validLogin.emit(true);
              this.pending = false;

              this.loginService.password = passw;
              this.loginService.username = user;
            },
            error => {
              this.validating = false;
              this.validLogin.emit(false);
              this.pending = false;
            });
          });
  }

  changed() {
    this.loginValid= false;
    this.validLogin.emit(false);
    this.userQueryChanged.next('');
    this.pending = true;

    this.loginService.password = '';
    this.loginService.username = '';
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  get isEmpty() {
    return this.formGroup.value["username"] === '' && this.formGroup.value["password"] === '';
  }

}
