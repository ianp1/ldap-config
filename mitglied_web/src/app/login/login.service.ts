import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoginService {

  private _username:string = "";
  private _password:string = "";

  public valuesChanged = new BehaviorSubject(false);

  constructor() { }

  public get username() {
    return this._username;
  }

  public set username(username:string) {
    this._username = username;

    if (username != '') {
      this.valuesChanged.next(true);
    }
  }

  public get password():string {
    return this._password;
  }

  public set password(password:string) {
    this._password = password;

    if (password != '') {
      this.valuesChanged.next(true);
    }
  }
}
