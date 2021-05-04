import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject } from "rxjs";
import { map } from 'rxjs/operators';

interface IAzureAuthenticationData {
    status: string,
    value?: {
        clientPrincipal: string
    }
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
            this.doCall();
        }
        return this.authMe_BehaviorSubject;
    }
    isLoggedIn = this.authMe_BehaviorSubject.pipe(map(authData => authData.value?.clientPrincipal != null));

    doCall() {
        this.httpClient.get('/.auth/me', { withCredentials: true }).subscribe({
            next: value => {
                console.log(value);
                this.authMe_BehaviorSubject.next({
                    status: 'done',
                    value: value as any
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
}