import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-groupcode',
  templateUrl: './groupcode.component.html',
  styleUrls: ['./groupcode.component.scss']
})
export class GroupcodeComponent implements OnInit {

  constructor() { }
  rapidPageValue?: string;

  ngOnInit(): void {
  }

  groupcode?: string;
  generateClicked() {
    this.groupcode = 'generated';
  }
  submitClicked() {
    this.groupcode = this.rapidPageValue;
  }
}
