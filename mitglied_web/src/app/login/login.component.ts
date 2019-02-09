import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

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

  @Input()
  formGroup : FormGroup;
  @Input()
  passwordControl : string;
  @Input()
  usernameControl : string;

  @Output()
  validLogin = new EventEmitter<boolean>();

  constructor(public appComponent:AppComponent, public http:HttpClient) {

  }

  ngOnInit() {
    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          this.validating = true;
          var user = this.appComponent.sanitize(this.formGroup.value[this.usernameControl]);
          var passw = this.appComponent.sanitize(this.formGroup.value[this.passwordControl]);
          var headers = new HttpHeaders();
          var params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Authentifizierung', {
            headers: headers,
            params: params
          }).subscribe(data =>{
              console.log("Authentifizierung erfolgreich: "+data);
              this.validating = false;
              this.loginValid = true;
              this.validLogin.emit(true);
              this.pending = false;
            },
            error => {
              console.log("fetched error: ", error);
              this.validating = false;
              this.validLogin.emit(false);
              this.pending = false;
            });
          });
  }

  changed() {
    console.log("changed");
    this.loginValid= false;
    this.validLogin.emit(false);
    this.userQueryChanged.next('');
    this.pending = true;
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  get isEmpty() {
    return this.formGroup.value[this.usernameControl] === '' && this.formGroup.value[this.passwordControl] === '';
  }

}
