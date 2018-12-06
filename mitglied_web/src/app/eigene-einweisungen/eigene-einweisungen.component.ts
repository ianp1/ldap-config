import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

import { Subject } from 'rxjs';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { debounceTime, map } from 'rxjs/operators';

@Component({
  selector: 'app-eigene-einweisungen',
  templateUrl: './eigene-einweisungen.component.html',
  styleUrls: ['./eigene-einweisungen.component.scss']
})
export class EigeneEinweisungenComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();
  loginForm: FormGroup;
  searching: boolean;

  users:any = [];
  url_base: string = 'http://127.0.0.1/mitglied_web/';

  einweisungen:any = [];

  columnsToDisplay = ['geraet', 'datum'];


  constructor(private appComponent:AppComponent, private http:HttpClient, private formBuilder:FormBuilder) { }


  get loginControls() { return this.loginForm.controls; }

  ngOnInit() {
    this.appComponent.title = "Einweisungen einsehen"

    this.loginForm = this.formBuilder.group({
       username: [''],
       password: [''],
       ownUser: [true],
       showUser: ['']
    });

    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          model => {
            var user = this.sanitize(this.loginForm.value['username']);
            var passw = this.sanitize(this.loginForm.value['password']);
            var searchTerm = this.encodeURL(this.sanitize(this.loginForm.value['showUser']));

            if (searchTerm != "") {
              this.searching = true;

              var headers = new HttpHeaders();
              var params = new HttpParams();
              params = params.append('author_user', user);
              params = params.append('author_password', passw);

              this.http.get(this.url_base+'api/v1.0/index.php/User/'+searchTerm, {
                headers: headers,
                params: params
              }).subscribe(data => {
                console.log("Suche erfolgreich: ", data);
                this.users=data;
                this.searching = false;
              }, error => {
                this.searching = false;
                console.log("fetched error: ", error);
              });
            }
          }
        );
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

  fetchUsers() {
    this.userQueryChanged.next('');
  }

  showEinweisungen() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);
    var searchTerm = "";
    if (this.loginForm.value['ownUser']) {
      searchTerm = this.encodeURL(this.sanitize(this.loginForm.value['username']));
    } else {
      searchTerm = this.encodeURL(this.sanitize(this.loginForm.value['showUser']));
    }

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);



    this.http.get(this.url_base+'api/v1.0/index.php/Einweisung/'+searchTerm, {
      headers: headers,
      params: params
    }).subscribe(data => {
      this.einweisungen = data;
    });
  }
}
