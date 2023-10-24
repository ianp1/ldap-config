import { Component, OnInit, ViewChild } from '@angular/core';

import { AppComponent } from '../app.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { LoginService } from '../login/login.service';
import { User } from '../models/user.model';

@Component({
  selector: 'rfid-besitzer-finden',
  templateUrl: './rfid-pruefen.component.html',
  styleUrls: ['./rfid-pruefen.component.scss']
})
export class RfidPruefenComponent implements OnInit {
  rfidQueryChanged: Subject<string> = new Subject<string>();

  loginForm: UntypedFormGroup = new UntypedFormGroup({
    username: new UntypedFormControl(''),
    password: new UntypedFormControl(''),
    rfid: new UntypedFormControl('')
  });

  searching:boolean = false;

  found_users:User[];
  noUsersFound:boolean = false;
  @ViewChild('rfidinput', {static: false})
  rfidInput;

  constructor(public appComponent:AppComponent, private http:HttpClient,
              private loginService:LoginService) { }

  ngOnInit() {
    this.rfidQueryChanged
        .pipe(debounceTime(500))
        .subscribe(() => {
          const user = this.appComponent.sanitize(this.loginService.username);
          const passw = this.appComponent.sanitize(this.loginService.password);
          const updateRfid = this.appComponent.encodeURL(this.appComponent.sanitize(this.loginForm.value['rfid']));

          const headers = new HttpHeaders();
          let params = new HttpParams();
          params = params.append('author_user', user);
          params = params.append('author_password', passw);

          this.searching = true;

          this.http.get<User[]>(this.appComponent.url_base+'api/v1.0/index.php/RFID/'+updateRfid, {
            headers: headers,
            params: params
          }).subscribe(data => {
            this.found_users = data;
            this.noUsersFound = false;
            this.searching = false;

            this.rfidInput.nativeElement.select();
            //this.rfidInput.;
          }, () => {
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
