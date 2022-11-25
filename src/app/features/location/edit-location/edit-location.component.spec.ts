import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLocationComponent } from './edit-location.component';

describe('EditLocationComponent', () => {
  let component: EditLocationComponent;
  let fixture: ComponentFixture<EditLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditLocationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
