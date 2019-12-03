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
import { CloudFileService } from 'app/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/webdav/mock-cloud-file-service';

describe('ChildBlockComponent', () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchoolBlockComponent, ChildBlockComponent ],
      imports: [RouterTestingModule, MatIconModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        { provide: Database, useClass: MockDatabase },
        { provide: CloudFileService, useClass: MockCloudFileService }
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
