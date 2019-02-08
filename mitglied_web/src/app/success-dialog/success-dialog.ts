import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Injectable, Component, Inject } from '@angular/core';


@Component({
  selector: 'success-dialog',
  templateUrl: 'success-dialog.html',
  styleUrls: ['./success-dialog.scss']
})
export class SuccessDialog {
  showCustomText : boolean = false;
  customText  = "";
  constructor (public dialogRef: MatDialogRef<SuccessDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any) {
    if (dialogData != null && typeof dialogData.customText !== 'undefined') {
      this.showCustomText = true;
      this.customText = dialogData.customText;
    }
  }
}
