import { Injectable, Component, Inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppComponent } from '../app.component';


import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(public dialog:MatDialog) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>> {
    let x = next.handle(req);

    return Observable.create(observer => {
      x.subscribe(data => {
        observer.next(data);
      }, error => {
        if (error.status !== 404 && error.status !== 401 && error.status !== 400) {


          const dialogRef = this.dialog.open(ErrorDialog);
        } else {
          observer.error(error);
        }
      });
    });
  }
}

@Component({
  selector: 'error-dialog',
  templateUrl: 'error-dialog.html',
  styleUrls: ['./error-dialog.scss']
})
export class ErrorDialog {

  constructor (public dialogRef: MatDialogRef<ErrorDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: ErrorDialog) {
  }
}
