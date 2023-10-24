import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

import { Subject } from 'rxjs';

import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { debounceTime } from 'rxjs/operators';

import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';
import { Einweisung } from '../models/einweisung.model';
import { EinweisungResponse } from './EinweisungResponse';

@Component({
  selector: 'einweisungen-einsehen',
  templateUrl: './eigene-einweisungen.component.html',
  styleUrls: ['./eigene-einweisungen.component.scss']
})
export class EigeneEinweisungenComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();
  loginForm: UntypedFormGroup;
  searching: boolean;
  validLogin: boolean = false;

  users:User[] = [];

  einweisungen:Einweisung[] = null;

  columnsToDisplay = ['geraet', 'datum'];
  selectedUser:User;
  ownUser: false;

  constructor(private appComponent:AppComponent, private http:HttpClient,
              private formBuilder:UntypedFormBuilder, private loginService:LoginService) {

  }


  get loginControls() { return this.loginForm.controls; }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
       ownUser: [false],
       showUser: ['']
    });

    this.loginForm.get('ownUser').valueChanges.subscribe(() => {
      this.einweisungen = null;
    });

    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          () => {
            const user = this.appComponent.sanitize(this.loginService.username);
            const passw = this.appComponent.sanitize(this.loginService.password);
            const searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['showUser']));

            if (searchTerm != "") {
              this.searching = true;

              const headers = new HttpHeaders();
              let params = new HttpParams();
              params = params.append('author_user', user);
              params = params.append('author_password', passw);

              this.http.get<User[]>(this.appComponent.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                headers: headers,
                params: params
              }).subscribe(data => {
                this.users=data;
                this.searching = false;
              }, error => {
                console.log("error searching users: ", error);
                this.searching = false;
              });
            }
          }
        );
  }

  userSelected(user:User) {
    this.selectedUser = user;
    this.einweisungen = null;
  }


  fetchUsers() {
    this.userQueryChanged.next('');
  }

  showEinweisungen() {
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);
    let searchTerm = "";
    if (this.loginForm.value['ownUser']) {
      searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginService.username));
    } else {
      searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['showUser']));
    }

    const headers = new HttpHeaders();
    let params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get<EinweisungResponse[]>(this.appComponent.url_base+'api/v1.0/index.php/Einweisung/'+searchTerm, {
      headers: headers,
      params: params
    }).subscribe(data => {
      console.log("einweisung response is: ", data);

      const einweisungen:Einweisung[] = [];
      
      for (const einweisungResponse of data) {
        const einweisung = new Einweisung();

        if (einweisungResponse.sicherheitsbelehrung) {
          einweisung.sicherheitsbelehrung = true;
        } else {
          //do this to prevent null values
          einweisung.sicherheitsbelehrung = false;
        }

        einweisung.geraet = einweisungResponse.geraet;
        einweisung.datum = einweisungResponse.datum;
        if (einweisungResponse.mentor) {
          einweisung.class = 'valid';
          einweisung.mentor = true;
        } else {
          einweisung.mentor = false;
          const date = new Date(this.appComponent.reformatLDAPDate(einweisungResponse.datum));

          date.setFullYear(date.getFullYear() + 1);
          const diff:number = ((date.getTime() - new Date().getTime()) / 1000.0 / 60.0 / 60.0 / 24.0 / 31.0);


          if (diff > 3) {
            einweisung.class = 'valid';
          } else if (diff >= 0) {
            einweisung.class = 'warning';
          } else {
            einweisung.class = 'invalid';
          }
        }

        einweisungen.push(einweisung);
      }
      console.log("einweisungen are: ", einweisungen);
      this.einweisungen = einweisungen;
    });
  }
}
