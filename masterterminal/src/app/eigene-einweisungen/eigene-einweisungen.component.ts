import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';

import { Subject } from 'rxjs';

import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { debounceTime, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { interval } from 'rxjs';

@Component({
  selector: 'einweisungen-einsehen',
  templateUrl: './eigene-einweisungen.component.html',
  styleUrls: ['./eigene-einweisungen.component.scss']
})
export class EigeneEinweisungenComponent implements OnInit {
  userQueryChanged: Subject<string> = new Subject<string>();
  searching: boolean;
  validLogin: boolean = false;

  users:any = [];

  einweisungen:any = null;

  columnsToDisplay = ['geraet', 'datum'];
  connected = false;
  lastReceived = 0;


  constructor(private appComponent:AppComponent, private http:HttpClient,
              private formBuilder:FormBuilder) {

  }

  ngOnInit() {

    this.connect();

  }

  connect() {
    var connection = new WebSocket(environment.ws_base);
    connection.onopen = () => {
      console.log("connected");
      this.connected = true;
    };

    connection.onclose = () => {
      console.log("connection closed");
      this.connected = false;
      this.connect();
    }

    interval(1000).subscribe(x => {
      console.log("interval called", Date.now(), this.lastReceived);
      if (Date.now() - this.lastReceived > 5000) {
        console.log("card removed");
        this.einweisungen = null;
      }
    });

    connection.onmessage = event => {
      console.log("received socket message: ", event);
      var msg = JSON.parse(event.data);
      var headers = new HttpHeaders();
      var params = new HttpParams();
      params = params.append('author_bot', "masterterminal");
      params = params.append('author_password', "dL45JgsltF7jm5MGvjzc");

      //TODO change route
      this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Einweisung/RFID/'+msg.rfid, {
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
        this.lastReceived = Date.now();
      }, error => {
        if (error.status == 404) {
          this.einweisungen = [];
        } else {
          this.einweisungen = null;
        }
        this.lastReceived = Date.now();
      });
    };
  }

  fetchUsers() {
  }

  showEinweisungen() {
    var searchTerm = "";



    var headers = new HttpHeaders();
    var params = new HttpParams();
    params = params.append('author_bot', "abc");
    params = params.append('author_password', "cde");

    //TODO change route
    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Einweisung/RFID/'+searchTerm, {
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
