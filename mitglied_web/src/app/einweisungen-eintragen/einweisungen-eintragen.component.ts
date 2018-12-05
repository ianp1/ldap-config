import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';


@Component({
  selector: 'app-einweisungen-eintragen',
  templateUrl: './einweisungen-eintragen.component.html',
  styleUrls: ['./einweisungen-eintragen.component.scss']
})

export class EinweisungenEintragenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();
  userQueryChanged: Subject<string> = new Subject<string>();

  validating: boolean = false;
  valid: boolean = false;

  searching: boolean = false;


  url_base: string = 'http://127.0.0.1/mitglied_web/';

  maschinen:any = [];
  users:any = [];

  loginForm: FormGroup;
  einweisungForm: FormGroup;


  constructor(private appComponent:AppComponent, private http:HttpClient, private formBuilder:FormBuilder) { }


  get loginControls() { return this.loginForm.controls; }
  get einweisungControls() { return this.einweisungForm.controls; }

  ngOnInit() {
    this.appComponent.title = "Neue Einweisungen eintragen"

    this.loginForm = this.formBuilder.group({
       username: [''],
       password: ['']
    });

    this.einweisungForm = this.formBuilder.group({
      eingewiesener: [''],
      maschine: [''],
      useCurrentDate: [true],
      date: [new Date()]
    });

    console.log(this.einweisungControls);

    this.http.get(this.url_base+'api/v1.0/index.php/Maschinen').subscribe(data => {
      this.maschinen = data;
      console.log(this.maschinen);
    });

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
      this.userQueryChanged
          .pipe(debounceTime(500))
          .subscribe(
            model => {
              var user = this.sanitize(this.loginForm.value['username']);
              var passw = this.sanitize(this.loginForm.value['password']);
              var searchTerm = this.encodeURL(this.sanitize(this.einweisungForm.value['eingewiesener']));

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

  checkLogin() {
    this.txtQueryChanged.next('');
  }

  sanitize(arg:string):string {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  fetchUsers() {
    this.userQueryChanged.next('');
  }

  enterEinweisung() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);
    var requestUser = this.encodeURL(this.sanitize(this.einweisungForm.value['eingewiesener']));
    var machine = this.encodeURL(this.sanitize(this.einweisungForm.value['maschine']));

    var date = this.appComponent.formatLDAPDate(new Date());
    if (!this.einweisungForm.value['useCurrentDate']) {
      var dateValue = this.sanitize(this.einweisungForm.value['date']);
      if (dateValue == '') {
        //TODO: Build warning
        return ;
      }
      date = this.appComponent.formatLDAPDate(dateValue);
    }
    var params = {
      'author_user' : user,
      'author_password' : passw
    };

    this.http.post(this.url_base+"api/v1.0/index.php/Einweisung/"+requestUser+"/"+machine+"/"+date,
      params
    ).subscribe(data => {
      if (data) {
        console.log("successfully posted einweisung: ", data);
      } else {
        console.log("error posting einweisung");
      }
    }, error => {
      console.log("fetched error: ", error);
    });
  }


  encodeURL(param:string):string {
    return encodeURI(param+"");
  }
}
