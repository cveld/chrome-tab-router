import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AzureAuthenticationComponent } from './azure-authentication.component';

describe('AzureAuthenticationComponent', () => {
  let component: AzureAuthenticationComponent;
  let fixture: ComponentFixture<AzureAuthenticationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AzureAuthenticationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureAuthenticationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
