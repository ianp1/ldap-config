import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';


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
  confirm = false;
  ok_text = "OK";

  constructor (public dialogRef: MatDialogRef<SuccessDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: SuccessDialogData) {

    if (dialogData != null) {
      if (typeof dialogData.customText !== 'undefined') {
        this.showCustomText = true;
        this.customText = dialogData.customText;
      }
      if (typeof dialogData.icon !== 'undefined') {
        this.icon = dialogData.icon;
      }
      if (typeof dialogData.icon_class !== 'undefined') {
        this.icon_class = dialogData.icon_class;
      }
      if (typeof dialogData.title !== 'undefined') {
        this.title = dialogData.title;
      }
      if (typeof dialogData.confirm !== 'undefined') {
        this.confirm = dialogData.confirm;
        if (this.confirm) {
          this.ok_text = "Abbrechen";
        }
      }
    }
  }

  override() {
    this.dialogRef.close(true);
  }
}

class SuccessDialogData {
    icon: string;
    icon_class: string;
    customText: string;
    title: string;
    confirm: boolean;
}
