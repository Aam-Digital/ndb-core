import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityNotFoundComponent } from './entity-not-found.component';

describe('EntityNotFoundComponent', () => {
  let component: EntityNotFoundComponent;
  let fixture: ComponentFixture<EntityNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityNotFoundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
