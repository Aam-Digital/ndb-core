import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildPresenceListComponent } from './child-presence-list.component';

describe('ChildPresenceListComponent', () => {
  let component: ChildPresenceListComponent;
  let fixture: ComponentFixture<ChildPresenceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildPresenceListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildPresenceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
