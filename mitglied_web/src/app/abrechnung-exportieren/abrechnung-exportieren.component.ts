import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { AppComponent } from '../app.component';

import * as fileSaver from 'file-saver';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'abrechnung-exportieren',
  templateUrl: './abrechnung-exportieren.component.html',
  styleUrls: ['./abrechnung-exportieren.component.scss']
})
export class AbrechnungExportierenComponent implements OnInit {
  pricesForm : FormGroup;

  constructor(public http: HttpClient, public appComponent: AppComponent, 
        public loginService: LoginService, private formBuilder: FormBuilder) { 

  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.pricesForm = this.formBuilder.group({
      foerdermitgliedschaft: ['60'],
      foerdermitgliedschaft_familie: ['80'],
      foerdermitgliedschaft_firma: ['50'],
      ordentliche_mitgliedschaft: ['10'],
      ehrenmitgliedschaft: ['0'],
      abrechnungsdatum: new Date()
   });
  }

  download() {
    var user = this.appComponent.sanitize(this.loginService.username);
    var passw = this.appComponent.sanitize(this.loginService.password);

    var params = {
      'author_user' : user,
      'author_password' : passw
    };

    let prices = JSON.stringify(this.pricesForm.value);
    let date = this.appComponent.formatLDAPDate(this.appComponent.sanitize(this.pricesForm.value['abrechnungsdatum']));
    this.http.post<Blob>(this.appComponent.url_base+'api/v1.0/index.php/Abrechnung/'+date+'/' + 
        this.appComponent.encodeURL(prices), params, {
          responseType: 'blob' as 'json'
        }).subscribe(
      data => {
        fileSaver.saveAs(data, "Abrechnung.csv");
        console.log("download response: ", data);
      }, error => {
        console.log("error receiving file", error);
      }
    );
    /*
    let prices = "{\"ehrenmitgliedschaft\":0,\"foerdermitgliedschaft\":60,\"foerdermitgliedschaft_familie\":80,\"foerdermitgliedschaft_firma\":50,\"ordentliche_mitgliedschaft\":10}";
    
    */
  }

}
