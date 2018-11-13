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

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
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
          this.http.post('http://localhost/mitglied_web/api/v1.0/index.php/Authentifizierung', {
            'author_user' : this.loginForm.value['username'],
            'author_password' : this.loginForm.value['password']
          }, {}).subscribe(data =>{
              console.log("Authentifizierung erfolgreich: "+data);
              this.validating = false;
              this.valid = true;
            });
          },
          error => {
            console.log(error);
            this.validating = false;
            this.valid = true;
          });
  }

  checkLogin() {
    this.txtQueryChanged.next('');
  }

}
