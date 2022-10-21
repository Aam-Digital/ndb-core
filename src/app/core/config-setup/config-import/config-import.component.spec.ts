import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigImportComponent } from './config-import.component';

describe('ConfigImportComponent', () => {
  let component: ConfigImportComponent;
  let fixture: ComponentFixture<ConfigImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigImportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
