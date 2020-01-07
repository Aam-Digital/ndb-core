import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareRevComponent } from './compare-rev.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatExpansionModule} from '@angular/material/expansion';
import {FormsModule} from '@angular/forms';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {AlertService} from '../../alerts/alert.service';
import {ConflictResolutionStrategyService} from '../conflict-resolution-strategy/conflict-resolution-strategy.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('CompareRevComponent', () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  beforeEach(async(() => {
    const confDialogMock = {
      openDialog: () => {}
    };
    spyOn(confDialogMock, 'openDialog');

    TestBed.configureTestingModule({
      imports: [
        MatTooltipModule,
        MatExpansionModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ConfirmationDialogService, useValue: confDialogMock },
        { provide: Database, useValue: new MockDatabase() },
        { provide: AlertService, useValue: { addDanger: () => {} } },
        ConflictResolutionStrategyService,
      ],
      declarations: [
        CompareRevComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareRevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
