import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import { AppComponent } from '../app.component';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormGroup } from '@angular/forms';

import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';
import { UserSearchService } from './user-search.service';

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
  @Input()
  filter: object;
  @Input()
  restoreSearch?: boolean = true;

  @Output()
  userSelected = new EventEmitter<User>();

  searching : boolean;

  users : User[] = [];

  validUser : boolean;

  emptySearchResult : boolean = false;

  @ViewChild('searchfield', {static: false})
  searchField;

  constructor(public appComponent:AppComponent, public http:HttpClient,
              private loginService:LoginService, 
              private userSearchService: UserSearchService) { }

  ngOnInit() {
    console.log("---------on init user search!!");
    this.userQueryChanged.subscribe(()=>{
      this.validUser=false;
    });
    this.userQueryChanged.subscribe(
      () => {
        console.log("reset results");
        this.userSelected.emit(null);
      }
    );
    if (this.restoreSearch) {
      const oldUsers = this.userSearchService.lastResult;
      if (oldUsers.length > 0) {
        this.users = oldUsers;
      }
      const oldSearch = this.userSearchService.lastSearch;
      const oldSelection = this.userSearchService.lastSelection;
      if (oldSelection !== undefined && oldSelection !== null) {
        this.emitSelectedUser(oldSelection.uid);
        const userSearchValue = [];
        userSearchValue[this.eingewiesenerControl] = oldSelection.uid;
        this.formGroup.patchValue(userSearchValue);
        this.validUser = true;
      } else {
        if (oldSearch !== "") {
          const oldSearchValue = [];
          oldSearchValue[this.eingewiesenerControl] = oldSearch;
          this.formGroup.patchValue(oldSearchValue);
          //this.formGroup.value[this.eingewiesenerControl] = oldSearch;
        }
      }
    }

    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          () => {
            const user = this.appComponent.sanitize(this.loginService.username);
            const passw = this.appComponent.sanitize(this.loginService.password);
            const searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.formGroup.value[this.eingewiesenerControl]));

            if (searchTerm != "") {
              this.emptySearchResult = false;
              this.searching = true;


              const headers = new HttpHeaders();
              let params = new HttpParams();
              params = params.append('author_user', user);
              params = params.append('author_password', passw);
              if (this.filter) {
                params = params.append('filter', JSON.stringify(this.filter));
              }

              this.http.get<User[]>(this.appComponent.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                headers: headers,
                params: params
              }).subscribe(data => {
                console.log("found users: ", data);
                this.userSearchService.lastSearch = searchTerm;
                this.userSearchService.lastResult = data;
                //for (let j = 0; j < (<Array<any>>data).length; j++) {
                  //var cUser = data[j];
                  /*if (cUser["rfid"] != null) {
                    console.log("user is ", cUser);
                    for (var i = 2; i < cUser["rfid"].length; i+= 3) {
                      cUser["rfid"] = cUser["rfid"].substr(0, i)+"_"+cUser["rfid"].substr(i);
                    }
                  }*/
                //}
                this.users = data;
                if (this.users.length === 0) {
                  this.emptySearchResult = true;
                }
                this.searching = false;
              }, error => {
                console.log("error searching for users: ", error);
                this.searching = false;
              });
            }
          }
        );

  }

  getUserByID(id:string) {
    for (const user of this.users) {
      if (user.uid === id) {
        this.validUser = true;
        return user;
      }
    }
  }


  fetchUsers() {
    this.userQueryChanged.next('');
  }

  public select() {
    this.searchField.nativeElement.focus();
  }

  public emitSelectedUser(userId: string) {
    console.log("emit user: ", userId);
    const user = this.getUserByID(userId);
    console.log("user is", user);
    this.userSelected.emit(user);
    this.userSearchService.lastSelection = user;
  }

}
