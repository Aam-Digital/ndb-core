import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitySubrecordComponent } from './entity-subrecord.component';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { MockDatabase } from '../../database/mock-database';
import { Database } from '../../database/database';
import { EntitySchemaService } from '../../entity/schema/entity-schema.service';
import { AlertService } from 'app/core/alerts/alert.service';
import { ConfirmationDialogService } from '../../confirmation-dialog/confirmation-dialog.service';
import { EntitySubrecordModule } from '../entity-subrecord.module';

describe('EntitySubrecordComponent', () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        EntitySubrecordModule,
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        AlertService,
        { provide: Database, useClass: MockDatabase },
        { provide: ConfirmationDialogService, useClass: ConfirmationDialogService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
