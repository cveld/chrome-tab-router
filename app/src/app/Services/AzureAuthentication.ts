import { HttpClient } from "@angular/common/http";
import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject } from "rxjs";
import { map } from 'rxjs/operators';
import { environment } from "src/environments/environment";

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
    constructor(private httpClient: HttpClient, private ngZone: NgZone) {}
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
        this.httpClient.get(environment.apibase + '/.auth/me', { withCredentials: true }).subscribe({
            next: value => {
                console.log(value);
                this.ngZone.run(() => {
                    this.authMe_BehaviorSubject.next({
                        status: 'done',
                        value: value as any
                    });                
                });
            },
            error: value => {
                this.ngZone.run(() => {
                    this.authMe_BehaviorSubject.next({
                        status: 'error',
                        value: value
                    });
                });
            }
        });
    }
}