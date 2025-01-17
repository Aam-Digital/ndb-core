import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPublicformRouteComponent } from './edit-publicform-route.component';

describe('EditPublicformRouteComponent', () => {
  let component: EditPublicformRouteComponent;
  let fixture: ComponentFixture<EditPublicformRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPublicformRouteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPublicformRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
