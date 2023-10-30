import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable()
export class UserSearchService {
    private _lastResult:User[] = [];
    private _lastSearch:string = '';
    private _lastSelection:(User|undefined) = undefined;


    public get lastResult() {
        return this._lastResult;
    }

    public set lastResult(result:User[]) {
        this._lastResult = result;
    }

    public get lastSearch() {
        return this._lastSearch;
    }

    public set lastSearch(search:string) {
        this._lastSearch = search;
    }

    public get lastSelection() {
        return this._lastSelection;
    }

    public set lastSelection(selection:User) {
        this._lastSelection = selection;
    }

    public reset() {
        this._lastResult = [];
        this._lastSearch = '';
    }
}