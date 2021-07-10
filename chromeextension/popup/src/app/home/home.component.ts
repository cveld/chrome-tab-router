import { Component, OnInit } from '@angular/core';
import { configUrl } from '../shared/settings';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  generateClicked() {
    chrome.tabs.create({
      url: configUrl
    });
  }

}
