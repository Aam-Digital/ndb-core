import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicFormComponent } from './public-form.component';

describe('PublicFormComponent', () => {
  let component: PublicFormComponent;
  let fixture: ComponentFixture<PublicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PublicFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
