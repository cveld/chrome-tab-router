import { Component, OnInit } from '@angular/core';
import { AzureAuthentication } from 'src/app/Services/AzureAuthentication';

@Component({
  selector: 'app-azure-authentication',
  templateUrl: './azure-authentication.component.html',
  styleUrls: ['./azure-authentication.component.scss']
})
export class AzureAuthenticationComponent implements OnInit {

  constructor(public azureAuthentication: AzureAuthentication) { }
  authMe = this.azureAuthentication.authMe();
  ngOnInit(): void {
  }

}
