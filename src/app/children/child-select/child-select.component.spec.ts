import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildSelectComponent } from './child-select.component';
import {ChildBlockComponent} from '../child-block/child-block.component';
import {MatAutocompleteModule, MatFormFieldModule, MatInputModule} from '@angular/material';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('ChildSelectComponent', () => {
  let component: ChildSelectComponent;
  let fixture: ComponentFixture<ChildSelectComponent>;

  let mockDb;

  beforeEach(async(() => {
    mockDb = new MockDatabase();

    TestBed.configureTestingModule({
      declarations: [ ChildSelectComponent, ChildBlockComponent ],
      imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule, FormsModule, CommonModule, NoopAnimationsModule],
      providers: [{provide: ChildrenService, useValue: new ChildrenService(new EntityMapperService(mockDb), mockDb)}],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
