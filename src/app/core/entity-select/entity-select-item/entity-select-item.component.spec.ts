import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitySelectItemComponent } from './entity-select-item.component';

describe('EntitySelectItemComponent', () => {
  let component: EntitySelectItemComponent;
  let fixture: ComponentFixture<EntitySelectItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntitySelectItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySelectItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
