import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoLocationDailogComponent } from './no-location-dailog.component';

describe('NoLocationDailogComponent', () => {
  let component: NoLocationDailogComponent;
  let fixture: ComponentFixture<NoLocationDailogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoLocationDailogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoLocationDailogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
