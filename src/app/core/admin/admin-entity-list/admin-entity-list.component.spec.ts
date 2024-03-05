import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEntityListComponent } from './admin-entity-list.component';

describe('AdminEntityListComponent', () => {
  let component: AdminEntityListComponent;
  let fixture: ComponentFixture<AdminEntityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminEntityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
