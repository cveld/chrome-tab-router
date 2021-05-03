import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject } from "rxjs";

interface IAzureAuthenticationData {
    status: string,
    value?: any
}

@Injectable({
    providedIn: 'root',
})
export class AzureAuthentication {
    constructor(private httpClient: HttpClient) {}
    private authMe_BehaviorSubject = new BehaviorSubject<IAzureAuthenticationData>({ status: 'init' });
    authMe() : BehaviorSubject<IAzureAuthenticationData> {        
        if (this.authMe_BehaviorSubject.value.status === 'init') {
            this.authMe_BehaviorSubject.next({status: 'loading'});
            this.httpClient.get('/.auth/me', { withCredentials: true }).subscribe({
                next: value => {
                    console.log(value);
                    this.authMe_BehaviorSubject.next({
                        status: 'done',
                        value: value
                    });
                    this.authMe_BehaviorSubject.complete();
                },
                error: value => {
                    this.authMe_BehaviorSubject.next({
                        status: 'error',
                        value: value
                    });
                }
            });
        }
        return this.authMe_BehaviorSubject;
    }
}