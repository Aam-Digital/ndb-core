import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureValidatorPopupComponent } from './configure-validator-popup.component';

describe('ConfigureValidatorPopupComponent', () => {
  let component: ConfigureValidatorPopupComponent;
  let fixture: ComponentFixture<ConfigureValidatorPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigureValidatorPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigureValidatorPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
