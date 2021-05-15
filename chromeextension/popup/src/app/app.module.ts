import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GroupcodeComponent } from './groupcode/groupcode.component';
import { PopupComponent } from './popup/popup.component';
import { HomeComponent } from './home/home.component';
import { UserprofilesComponent } from './userprofiles/userprofiles.component';

@NgModule({
  declarations: [
    AppComponent,
    GroupcodeComponent,
    PopupComponent,
    HomeComponent,
    UserprofilesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [
    // { provide: APP_INITIALIZER, useFactory: init, deps: [], multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
