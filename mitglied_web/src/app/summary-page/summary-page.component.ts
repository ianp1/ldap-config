import { Component, OnInit } from '@angular/core';

import { LoginService } from '../login/login.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppComponent } from '../app.component';

@Component({
  selector: 'summary-page',
  templateUrl: './summary-page.component.html',
  styleUrls: ['./summary-page.component.scss']
})
export class SummaryPageComponent implements OnInit {

  changes:{"einweisungen":any, "sicherheitsbelehrungen":any};
  columnsEinweisungen = ['geraet', 'eingewiesener', 'einweisungsdatum', 'edit'];

  columnsSicherheitsbelehrungen = ['eingewiesener', 'einweisungsdatum'];


  constructor(private loginService: LoginService, private http: HttpClient,
              private appComponent: AppComponent) { }

  ngOnInit() {
    this.loginService.valuesChanged.subscribe(model => {
      if (model) {
        this.updateSummary();
      }
    });
  }

  updateSummary() {
    var headers = new HttpHeaders();
    var params = new HttpParams();
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.get(this.appComponent.url_base+'api/v1.0/index.php/Einweisungen/Recent', {
      headers:headers,
      params:params
    }).subscribe(data => {
      console.log(data);

      //this.changes = <Array<any>>data;
      this.changes = {
        "einweisungen":<Array<any>>data["einweisungen"],
        "sicherheitsbelehrungen":<Array<any>>data["sicherheitsbelehrung"]
      };
      console.log(this.changes);
    });
  }

  widerrufe(dn) {
    console.log("widerrufe ", dn);
    var headers = new HttpHeaders();
    var params = new HttpParams();
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    params = params.append('author_user', user);
    params = params.append('author_password', passw);

    this.http.delete(this.appComponent.url_base+'api/v1.0/index.php/Einweisungen/'+dn, {
      headers: headers,
      params: params
    }).subscribe(data => {
      this.updateSummary();
    });
  }
}
