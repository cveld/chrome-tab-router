import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeUserprofileDialogComponent } from './change-userprofile-dialog.component';

describe('ChangeUserprofileDialogComponent', () => {
  let component: ChangeUserprofileDialogComponent;
  let fixture: ComponentFixture<ChangeUserprofileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChangeUserprofileDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeUserprofileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
