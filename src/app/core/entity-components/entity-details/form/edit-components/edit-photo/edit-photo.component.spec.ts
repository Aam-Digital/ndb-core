import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPhotoComponent } from './edit-photo.component';

describe('EditPhotoComponent', () => {
  let component: EditPhotoComponent;
  let fixture: ComponentFixture<EditPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditPhotoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
