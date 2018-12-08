import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl } from '@angular/forms';

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
  usernameControl : string;
  @Input()
  passwordControl : string;
  @Input()
  eingewiesenerControl : string;

  searching : boolean;

  users : any;

  constructor(public appComponent:AppComponent, public http:HttpClient) { }

  ngOnInit() {
    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          model => {
            var user = this.appComponent.sanitize(this.formGroup.value['username']);
            var passw = this.appComponent.sanitize(this.formGroup.value['password']);
            var searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.formGroup.value['eingewiesener']));

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
                console.log("Suche erfolgreich: ", data);
                this.users = data;
                this.searching = false;
              }, error => {
                this.searching = false;
                console.log("fetched error: ", error);
              });
            }
          }
        );

  }


  fetchUsers() {
    this.userQueryChanged.next('');
  }

}
