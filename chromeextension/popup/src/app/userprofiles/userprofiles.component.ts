import { Component, OnInit } from '@angular/core';
import { UserprofilesHandler } from '../services/userprofilesHandler';

@Component({
  selector: 'app-userprofiles',
  templateUrl: './userprofiles.component.html',
  styleUrls: ['./userprofiles.component.scss']
})
export class UserprofilesComponent implements OnInit {
  userprofiles = this.userprofilesHandler.userprofiles;
  constructor(private userprofilesHandler : UserprofilesHandler) { }

  ngOnInit(): void {
  }

}
