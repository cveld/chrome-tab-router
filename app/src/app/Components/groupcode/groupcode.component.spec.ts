import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupcodeComponent } from './groupcode.component';

describe('GroupcodeComponent', () => {
  let component: GroupcodeComponent;
  let fixture: ComponentFixture<GroupcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupcodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
