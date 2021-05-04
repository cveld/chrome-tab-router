import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChromeInstanceComponent } from './Components/chrome-instance/chrome-instance.component';
import { HomeComponent } from './Components/home/home.component';
import { init } from './Services/Messaging/DocumentEventing';
import { AzureAuthenticationComponent } from './Components/azure-authentication/azure-authentication.component';
import { HttpClientModule } from '@angular/common/http';
import { GroupcodeComponent } from './Components/groupcode/groupcode.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    ChromeInstanceComponent,
    HomeComponent,
    AzureAuthenticationComponent,
    GroupcodeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: init, deps: [], multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
