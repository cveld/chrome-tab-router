import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GroupcodeComponent } from './groupcode/groupcode.component';
import { PopupComponent } from './popup/popup.component';
import { HomeComponent } from './home/home.component';
import { UserprofilesComponent } from './userprofiles/userprofiles.component';
import { LogComponent } from './log/log.component';
import { FormsModule } from '@angular/forms';
import { ConnectionComponent } from './connection/connection.component';
import { TabsComponent } from './tabs/tabs.component';
import { RulesComponent } from './rules/rules.component';
import { AddRuleDialogComponent } from './add-rule-dialog/add-rule-dialog.component';
import { ChangeUserprofileDialogComponent } from './change-userprofile-dialog/change-userprofile-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    GroupcodeComponent,
    PopupComponent,
    HomeComponent,
    UserprofilesComponent,
    LogComponent,
    ConnectionComponent,
    TabsComponent,
    RulesComponent,
    AddRuleDialogComponent,
    ChangeUserprofileDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule
  ],
  providers: [
    // { provide: APP_INITIALIZER, useFactory: init, deps: [], multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
