import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-einweisungen-eintragen',
  templateUrl: './einweisungen-eintragen.component.html',
  styleUrls: ['./einweisungen-eintragen.component.sass']
})
export class EinweisungenEintragenComponent implements OnInit {
  txtQueryChanged: Subject<string> = new Subject<string>();

  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });


  constructor(private appComponent:AppComponent) { }

  ngOnInit() {
    this.appComponent.title = "Neue Einweisungen eintragen"

    this.txtQueryChanged
        .pipe(debounceTime(500))
        .subscribe(model => {
          console.log(this.loginForm.value);
        });
  }

  checkLogin() {
    this.txtQueryChanged.next('');
  }

}
