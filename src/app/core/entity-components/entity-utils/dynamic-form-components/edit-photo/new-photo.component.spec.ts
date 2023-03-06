import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPhotoComponent } from './new-photo.component';

describe('NewPhotoComponent', () => {
  let component: NewPhotoComponent;
  let fixture: ComponentFixture<NewPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NewPhotoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
