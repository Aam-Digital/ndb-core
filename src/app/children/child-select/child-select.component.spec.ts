import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildSelectComponent } from './child-select.component';
import {ChildBlockComponent} from '../child-block/child-block.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {ChildrenService} from '../children.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import {of} from 'rxjs';

describe('ChildSelectComponent', () => {
  let component: ChildSelectComponent;
  let fixture: ComponentFixture<ChildSelectComponent>;

  const mockChildrenService = {
    getChildren() {
      return of([]);
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ChildSelectComponent,
        ChildBlockComponent,
        SchoolBlockComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        FormsModule,
        CommonModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
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
