import { Component, OnInit } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-sicherheitsbelehrung-eintragen',
  templateUrl: './sicherheitsbelehrung-eintragen.component.html',
  styleUrls: ['./sicherheitsbelehrung-eintragen.component.scss']
})
export class SicherheitsbelehrungEintragenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();
  validating: boolean = false;
  valid: boolean = false;

  url_base:String = 'http://127.0.0.1/mitglied_web/';

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  sicherheitForm: FormGroup = new FormGroup({
    vorname: new FormControl(''),
    nachname: new FormControl(''),
    geburtsdatum: new FormControl('')
  })

  constructor(private appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title="Neue Sicherheitsbelehrungen eintragen";

    this.txtQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          this.validating = true;
          console.log(this.loginForm.value);
          var user = this.sanitize(this.loginForm.value['username']);
          var passw = this.sanitize(this.loginForm.value['password']);

          this.http.get(this.url_base+'api/v1.0/index.php/Authentifizierung?author_user='+user+'&author_password='+passw).subscribe(data =>{
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

  checkExistance() {
    var user = this.sanitize(this.loginForm.value['username']);
    var passw = this.sanitize(this.loginForm.value['password']);

    var vorname = this.sanitize(this.sicherheitForm.value['vorname']);
    var nachname = this.sanitize(this.sicherheitForm.value['nachname']);
    var geburtsdatum = this.sanitize(this.sicherheitForm.value['geburtsdatum']);
    console.log("test");
    console.log("vorname:",vorname,"nachname:",nachname,"geburtsdatum:",geburtsdatum);
    if (vorname != '' && nachname != '' && geburtsdatum != '') {
      this.http.get(this.url_base+'api/v1.0/index.php/User/'+vorname+'/'+nachname+'/'+geburtsdatum+'?author_user='+user+'&author_password='+passw).subscribe(data => {
        console.log("Sicherheitsbelehrungen vorhanden für: "+data);
      }, error=> {
        console.log("fetched error: ", error);
      });
    }
  }
}

/*
@Component({
  selector: 'dialog-user-existing',
  templateUrl: 'dialog-user-existing.html'
})
export class DialogUserExisting {
}*/
