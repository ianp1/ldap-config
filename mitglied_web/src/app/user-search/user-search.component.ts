import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl } from '@angular/forms';

import { LoginService } from '../login/login.service';

@Component({
  selector: 'user-search',
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();

  @Input()
  formGroup : FormGroup;
  @Input()
  eingewiesenerControl : string;

  @Output()
  userSelected = new EventEmitter<any>();

  searching : boolean;

  users : any;

  validUser : boolean;

  constructor(public appComponent:AppComponent, public http:HttpClient,
              private loginService:LoginService) { }

  ngOnInit() {
    this.userQueryChanged.subscribe(model=>{
      this.validUser=false;
    });
    this.userQueryChanged.subscribe(
      model => {
        console.log("reset results");
        this.userSelected.emit(null);
      }
    );
    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          model => {
            var user = this.appComponent.sanitize(this.loginService.username);
            var passw = this.appComponent.sanitize(this.loginService.password);
            var searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.formGroup.value[this.eingewiesenerControl]));

            if (searchTerm != "") {
              this.searching = true;

              var headers = new HttpHeaders();
              var params = new HttpParams();
              params = params.append('author_user', user);
              params = params.append('author_password', passw);

              this.http.get(this.appComponent.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                headers: headers,
                params: params
              }).subscribe(data => {
                this.users = data;
                this.searching = false;
              }, error => {
                this.searching = false;
              });
            }
          }
        );

  }

  getUserByID(id:string) {
    for (let user of this.users) {
      if (user.uid === id) {
        this.validUser = true;
        return user;
      }
    }
  }


  fetchUsers() {
    this.userQueryChanged.next('');
  }

}
