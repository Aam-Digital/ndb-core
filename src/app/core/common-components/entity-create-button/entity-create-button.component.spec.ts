import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityCreateButtonComponent } from './entity-create-button.component';

describe('EntityCreateButtonComponent', () => {
  let component: EntityCreateButtonComponent;
  let fixture: ComponentFixture<EntityCreateButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCreateButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntityCreateButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
