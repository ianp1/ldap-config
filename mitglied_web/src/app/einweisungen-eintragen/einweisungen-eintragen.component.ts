import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-einweisungen-eintragen',
  templateUrl: './einweisungen-eintragen.component.html',
  styleUrls: ['./einweisungen-eintragen.component.scss']
})
export class EinweisungenEintragenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();
  validating: boolean = false;
  valid: boolean = false;
  validColor: String = "primary";

  maschinen:any = [];
  users:any = [];

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });
  einweisungForm: FormGroup = new FormGroup({
    eingewiesener: new FormControl(''),
    maschine: new FormControl('')
  });


  constructor(private appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title = "Neue Einweisungen eintragen"

    this.http.get('http://localhost/mitglied_web/api/v1.0/index.php/Maschinen').subscribe(data => {
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

          this.http.get('http://localhost/mitglied_web/api/v1.0/index.php/Authentifizierung?author_user='+user+'&author_password='+passw).subscribe(data =>{
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
  }

  checkLogin() {
    this.txtQueryChanged.next('');
  }

  sanitize(arg:String):String {
    if (arg == undefined || arg == null) {
      return "";
    }
    return arg;
  }

  fetchUsers() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);
    var searchTerm = this.sanitize(this.einweisungForm.value['eingewiesener']);

    this.http.get('http://localhost/mitglied_web/api/v1.0/index.php/User?author_user='+user+'&author_password='+passw+'&search_term='+searchTerm).subscribe(data => {
      console.log("Suche erfolgreich: ", data);
      this.users=data;
    }, error => {
      console.log("fetched error: ", error);
    });
  }

  enterEinweisung() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);
    var requestUser = this.sanitize(this.einweisungForm.value['eingewiesener']);
    var machine = this.sanitize(this.einweisungForm.value['maschine']);

    this.http.post('http://localhost/mitglied_web/api/v1.0/index.php/Einweisung/'+requestUser, {
      'author_user' : user,
      'author_password' : passw,
      'machine' : machine
    }).subscribe(data => {
      console.log("successfully posted einweisung: ", data);
    }, error => {
      console.log("fetched error: ", error);
    });
  }

}
