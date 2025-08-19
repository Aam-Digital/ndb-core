import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEmailComponent } from './edit-email.component';

describe('EditEmailComponent', () => {
  let component: EditEmailComponent;
  let fixture: ComponentFixture<EditEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
