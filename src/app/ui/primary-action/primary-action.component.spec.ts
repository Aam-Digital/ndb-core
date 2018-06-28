import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryActionComponent } from './primary-action.component';
import {MatButtonModule, MatDialogModule} from '@angular/material';
import {SessionService} from '../../session/session.service';

describe('PrimaryActionComponent', () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;

  const mockSessionService = { getCurrentUser: () => { return { name: 'tester' }; }};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrimaryActionComponent ],
      imports: [MatDialogModule, MatButtonModule],
      providers: [{provide: SessionService, useValue: mockSessionService }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
