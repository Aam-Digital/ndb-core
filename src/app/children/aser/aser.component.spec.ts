import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AserComponent } from './aser.component';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {Child} from '../child';
import {DatePipe} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AserComponent', () => {
  let component: AserComponent;
  let fixture: ComponentFixture<AserComponent>;

  const mockChildrenService = {
    getChild: (id) => {
      return Observable.of([new Child('22')]);
    },
    getAserResultsOfChild: (id) => {
      return Observable.of([]);
    }
  };
  let mockEntityMapper;


  beforeEach(async(() => {
    mockEntityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ AserComponent ],
      imports: [ UiHelperModule, FormsModule, NoopAnimationsModule],
      providers: [
        DatePipe,
        { provide: ActivatedRoute, useValue: {paramMap: Observable.of({get: () => '22'}) } },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
