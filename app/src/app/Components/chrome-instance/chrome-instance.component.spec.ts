import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChromeInstanceComponent } from './chrome-instance.component';

describe('ChromeInstanceComponent', () => {
  let component: ChromeInstanceComponent;
  let fixture: ComponentFixture<ChromeInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChromeInstanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChromeInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
