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
  icon = "check";
  icon_class = "";
  title = "Erfolg";
  constructor (public dialogRef: MatDialogRef<SuccessDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any) {
    console.log(dialogData);
    if (dialogData != null && typeof dialogData.customText !== 'undefined') {
      this.showCustomText = true;
      this.customText = dialogData.customText;
    }
    if (dialogData != null && typeof dialogData.icon !== 'undefined') {
      this.icon = dialogData.icon;
    }
    if (dialogData != null && typeof dialogData.icon_class !== 'undefined') {
      this.icon_class = dialogData.icon_class;
    }
    if (dialogData != null && typeof dialogData.title !== 'undefined') {
      this.title = dialogData.title;
    }
  }
}
