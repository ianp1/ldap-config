import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { AppComponent } from '../app.component';

import * as fileSaver from 'file-saver';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'abrechnung-exportieren',
  templateUrl: './abrechnung-exportieren.component.html',
  styleUrls: ['./abrechnung-exportieren.component.scss']
})
export class AbrechnungExportierenComponent implements OnInit {
  pricesForm : UntypedFormGroup;

  constructor(public http: HttpClient, public appComponent: AppComponent, 
        public loginService: LoginService, private formBuilder: UntypedFormBuilder) { 

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
    const user = this.appComponent.sanitize(this.loginService.username);
    const passw = this.appComponent.sanitize(this.loginService.password);

    const params = {
      'author_user' : user,
      'author_password' : passw
    };

    const prices = JSON.stringify(this.pricesForm.value);
    const date = this.appComponent.formatLDAPDate(this.appComponent.sanitize(this.pricesForm.value['abrechnungsdatum']));
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
