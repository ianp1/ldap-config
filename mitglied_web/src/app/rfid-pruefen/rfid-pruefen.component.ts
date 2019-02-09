import { Component, OnInit } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-rfid-pruefen',
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

  validating:boolean = false;
  valid:boolean = false;

  searching:boolean = false;

  found_users:any;

  constructor(public appComponent:AppComponent, private http:HttpClient) { }

  ngOnInit() {
    this.appComponent.title = "RFID-Tag überprüfen";

    this.rfidQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          var user = this.appComponent.sanitize(this.loginForm.value['username']);
          var passw = this.appComponent.sanitize(this.loginForm.value['password']);
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

            this.searching = false;

            console.log("found users: ", this.found_users);
          }, error => {
            this.found_users = null;
            this.searching = false;
            console.warn("error fetching users: ", error);
          });
        });
  }

  findUser() {
    this.rfidQueryChanged.next('');
  }

}
