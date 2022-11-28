import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingEntitiesComponent } from './matching-entities.component';

describe('MatchingEntitiesComponent', () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatchingEntitiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
