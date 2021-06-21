import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectionComponent } from './connection/connection.component';
import { GroupcodeComponent } from './groupcode/groupcode.component';
import { HomeComponent } from './home/home.component';
import { LogComponent } from './log/log.component';
import { PopupComponent } from './popup/popup.component';
import { RulesComponent } from './rules/rules.component';
import { TabsComponent } from './tabs/tabs.component';
import { UserprofilesComponent } from './userprofiles/userprofiles.component';

const routes: Routes = [
  { path: 'home', 
    component: TabsComponent,
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: HomeComponent },
      { path: 'connection', component: ConnectionComponent },
      { path: 'groupcode', component: GroupcodeComponent },
      { path: 'rules', component: RulesComponent },
      { path: 'userprofiles', component: UserprofilesComponent },
      { path: 'log', component: LogComponent }
    ]
  },
  { path: 'popup', component: PopupComponent },
  { path: '',   redirectTo: '/home/welcome', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
