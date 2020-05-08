import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildBlockComponent } from './child-block.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Child } from '../model/child';
import { SchoolBlockComponent } from '../../schools/school-block/school-block.component';
import { MatIconModule } from '@angular/material/icon';
import { ChildrenService } from '../children.service';
import { of } from 'rxjs';

describe('ChildBlockComponent', () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj('mockChildrenService', ['getChild']);
    mockChildrenService.getChild.and.returnValue(of(new Child('')));

    TestBed.configureTestingModule({
      declarations: [ SchoolBlockComponent, ChildBlockComponent ],
      imports: [RouterTestingModule, MatIconModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
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
