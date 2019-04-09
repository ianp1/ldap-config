import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

import { Subject } from 'rxjs';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { debounceTime, map } from 'rxjs/operators';

import { LoginService } from '../login/login.service';

@Component({
  selector: 'einweisungen-einsehen',
  templateUrl: './eigene-einweisungen.component.html',
  styleUrls: ['./eigene-einweisungen.component.scss']
})
export class EigeneEinweisungenComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();
  loginForm: FormGroup;
  searching: boolean;
  validLogin: boolean = false;

  users:any = [];

  einweisungen:any = null;

  columnsToDisplay = ['geraet', 'datum'];


  constructor(private appComponent:AppComponent, private http:HttpClient,
              private formBuilder:FormBuilder, private loginService:LoginService) {

  }


  get loginControls() { return this.loginForm.controls; }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
       ownUser: [false],
       showUser: ['']
    });

    this.userQueryChanged
        .pipe(debounceTime(500))
        .subscribe(
          model => {
            var user = this.appComponent.sanitize(this.loginService.username);
            var passw = this.appComponent.sanitize(this.loginService.password);
            var searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['showUser']));

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
                this.users=data;
                this.searching = false;
              }, error => {
                this.searching = false;
              });
            }
          }
        );
  }

  fetchUsers() {
    this.userQueryChanged.next('');
  }

  showEinweisungen() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);
    var searchTerm = "";
    if (this.loginForm.value['ownUser']) {
      searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginService.username));
    } else {
      searchTerm = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['showUser']));
    }

    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Einweisung/'+searchTerm, {
      headers: headers,
      params: params
    }).subscribe(data => {
      var requestData = <Array<any>> data;

      var einweisung:any;
      for (einweisung of requestData) {
        console.log(einweisung);
        console.log(einweisung.mentor);
        if (einweisung.mentor) {
          einweisung.class = 'valid';
        } else {
          var date = new Date(this.appComponent.reformatLDAPDate(einweisung.datum));

          date.setFullYear(date.getFullYear() + 1);
          var diff:Number = ((date.getTime() - new Date().getTime()) / 1000.0 / 60.0 / 60.0 / 24.0 / 31.0);


          if (diff > 3) {
            einweisung.class = 'valid';
          } else if (diff >= 0) {
            einweisung.class = 'warning';
          } else {
            einweisung.class = 'invalid';
          }
        }
      }
      this.einweisungen = data;
    });
  }
}
