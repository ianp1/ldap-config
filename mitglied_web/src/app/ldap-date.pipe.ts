import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ldapDate'
})
export class LdapDatePipe implements PipeTransform {

  transform(value: string, args?: any): Date {

    console.warn(Number(value.substring(0,4)));
    console.warn(Number(value.substring(4,6))-1);
    console.warn(Number(value.substring(6,8)));

    return new Date(Number(value.substring(0,4)), Number(value.substring(4,6))-1, Number(value.substring(6,8)));
  }

}
