import { Component, OnInit } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { LoginService } from '../login/login.service';

@Component({
  selector: 'rfid-besitzer-finden',
  templateUrl: './rfid-pruefen.component.html',
  styleUrls: ['./rfid-pruefen.component.scss']
})
export class RfidPruefenComponent implements OnInit {
  rfidQueryChanged: Subject<string> = new Subject<string>();

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
    rfid: new FormControl('')
  });

  searching:boolean = false;

  found_users:any;
  noUsersFound:boolean = false;

  constructor(public appComponent:AppComponent, private http:HttpClient,
              private loginService:LoginService) { }

  ngOnInit() {
    this.rfidQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          var user = this.appComponent.sanitize(this.loginService.username);
          var passw = this.appComponent.sanitize(this.loginService.password);
          var updateRfid = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['rfid']));

          var headers = new HttpHeaders();
          var params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.searching = true;

          this.http.get(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
            headers: headers,
            params: params
          }).subscribe(data => {
            this.found_users = data;
            this.noUsersFound = false;
            this.searching = false;


          }, error => {
            this.found_users = null;
            this.noUsersFound = true;
            this.searching = false;

          });
        });
  }

  findUser() {
    this.rfidQueryChanged.next('');
  }

}
