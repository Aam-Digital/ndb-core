import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildBlockComponent } from './child-block.component';
import {RouterTestingModule, SpyNgModuleFactoryLoader} from '@angular/router/testing';
import {Child} from '../child';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import { MatIconModule } from '@angular/material/icon';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {ChildrenService} from '../children.service';
import {Database} from '../../database/database';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import { SessionService } from 'app/session/session.service';
import { BlobService } from 'app/webdav/blob-service.service';
import { DatabaseManagerService } from 'app/database/database-manager.service';
import { AlertService } from 'app/alerts/alert.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { userInfo } from 'os';
import { User } from 'app/user/user';
import { MockBlobService } from 'app/webdav/mock-blob-service';

describe('ChildBlockComponent', () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
//  let sessionService = { getCurrentUser: () => new User('TestUser')};


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchoolBlockComponent, ChildBlockComponent ],
      imports: [RouterTestingModule, MatIconModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        { provide: Database, useClass: MockDatabase },
        { provide: BlobService, useClass: MockBlobService }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockComponent);
    component = fixture.componentInstance;
    component.entity = new Child('');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
