import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Injectable, Component, Inject } from '@angular/core';


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
