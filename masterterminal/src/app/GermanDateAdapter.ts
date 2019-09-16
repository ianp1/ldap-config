import { NativeDateAdapter } from "@angular/material";
import { Injectable } from '@angular/core';


@Injectable()
export class GermanDateAdapter extends NativeDateAdapter{
  parse (value : any) : Date | null {
    console.log("parse: ", value);
    if ((typeof value === 'string') && (value.indexOf('.') > -1)) {
      const str = value.split('.');
      if (str.length < 2 || isNaN(+str[0]) || isNaN(+str[1]) || isNaN(+str[2])) {
        return null;
      }
      return new Date(Number(str[2]), Number(str[1]) - 1, Number(str[0]), 12);
    }
    console.log("value after : ", value);
    const timestamp = typeof value === 'number' ? value : Date.parse(value);


    console.log("timestamp ", timestamp);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }
}
