import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
  pending : boolean = true;

  formGroup : FormGroup;

  @Output()
  validLogin = new EventEmitter<boolean>();

  constructor(public appComponent:AppComponent, public http:HttpClient,
              private formBuilder: FormBuilder, private loginService: LoginService) {

    this.initForm();
  }

  initForm() {
    let username = "";
    let password = "";

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
        .subscribe(() => {
          this.validating = true;
          const user = this.appComponent.sanitize(this.formGroup.value["username"]);
          const passw = this.appComponent.sanitize(this.formGroup.value["password"]);
          const headers = new HttpHeaders();
          let params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Authentifizierung', {
            headers: headers,
            params: params
          }).subscribe(() =>{
              this.loginService.password = passw;
              this.loginService.username = user;
              this.validating = false;
              this.loginValid = true;
              this.validLogin.emit(true);
              this.pending = false;
            },
            error => {
              console.log("error logging in: ", error);
              this.validating = false;
              this.validLogin.emit(false);
              this.pending = false;
            });
          });
  }

  changed() {
    this.loginValid = false;
    this.validLogin.emit(false);
    this.validating = true;
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
