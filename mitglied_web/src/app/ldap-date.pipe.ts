import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ldapDate'
})
export class LdapDatePipe implements PipeTransform {

  transform(value: string, args?: any): Date {





    return new Date(Number(value.substring(0,4)), Number(value.substring(4,6))-1, Number(value.substring(6,8)));
  }

}
