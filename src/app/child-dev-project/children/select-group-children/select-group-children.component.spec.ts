import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectGroupChildrenComponent } from './select-group-children.component';
import { ChildrenService } from '../children.service';
import { BehaviorSubject } from 'rxjs';
import { Child } from '../model/child';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { SchoolsModule } from '../../schools/schools.module';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SelectGroupChildrenComponent', () => {
  let component: SelectGroupChildrenComponent;
  let fixture: ComponentFixture<SelectGroupChildrenComponent>;

  let mockChildrenService;
  const mockChildrenObservable = new BehaviorSubject([]);

  beforeEach(async(() => {
    mockChildrenService = jasmine.createSpyObj(['getChildren']);
    mockChildrenService.getChildren.and.returnValue(mockChildrenObservable);

    TestBed.configureTestingModule({
      declarations: [
        SelectGroupChildrenComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        NoopAnimationsModule,
        SchoolsModule,
      ],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectGroupChildrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract all centers', () => {
    const mockChildren = [
      new Child('0'),
      new Child('1'),
    ];
    mockChildren[0].center = 'Center A';
    mockChildren[1].center = 'Center B';

    mockChildrenObservable.next(mockChildren);

    expect(component.centers).toEqual([mockChildren[0].center, mockChildren[1].center]);
  });


  it('should extract all schools of selected center', () => {
    const selectedCenter = 'Center A';
    const mockChildren = [
      new Child('0'),
      new Child('1'),
      new Child('2'),
      new Child('3'),
    ];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = 'School:1';
    mockChildren[1].center = selectedCenter;
    mockChildren[1].schoolId = 'School:2';
    mockChildren[3].center = 'other center';
    mockChildren[3].schoolId = 'School:3';

    mockChildrenObservable.next(mockChildren);

    component.loadStudentGroupFilterForCenter(selectedCenter);

    expect(component.studentGroupFilters.options.length).toBe(3); // includes default option "all schools"
    expect(component.studentGroupFilters.options[1].key).toBe('School:1');
    expect(component.studentGroupFilters.options[2].key).toBe('School:2');
  });

  it('should not list empty filter for undefined schools', () => {
    const selectedCenter = 'Center A';
    const mockChildren = [
      new Child('0'),
      new Child('1'),
    ];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = 'School:1';
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set

    mockChildrenObservable.next(mockChildren);

    component.loadStudentGroupFilterForCenter(selectedCenter);

    expect(component.studentGroupFilters.options.length).toBe(2); // includes default option "all schools"
    expect(component.studentGroupFilters.options[1].key).toBe('School:1');
  });


  it('should emit selected children correctly filtered by center and school', () => {
    const selectedCenter = 'Center A';
    const selectedSchool = 'School:1';

    const mockChildren = [
      new Child('0'),
      new Child('1'),
      new Child('2'),
    ];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = selectedSchool;
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set
    mockChildren[2].center = 'other center';
    mockChildren[2].schoolId = selectedSchool;

    mockChildrenObservable.next(mockChildren);

    spyOn(component.valueChange, 'emit');

    component.loadStudentGroupFilterForCenter(selectedCenter);
    component.updateSelectedChildren(component.studentGroupFilters.options.find(o => o.key === selectedSchool));

    expect(component.valueChange.emit).toHaveBeenCalledWith([mockChildren[0]]);
  });

  it('should emit all children of center for default filter', () => {
    const selectedCenter = 'Center A';

    const mockChildren = [
      new Child('0'),
      new Child('1'),
      new Child('2'),
    ];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = 'School:1';
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set
    mockChildren[2].center = 'other center';
    mockChildren[2].schoolId = 'School:1';

    mockChildrenObservable.next(mockChildren);

    spyOn(component.valueChange, 'emit');

    component.loadStudentGroupFilterForCenter(selectedCenter);
    component.updateSelectedChildren(component.studentGroupFilters.options.find(o => o.key === 'all'));

    expect(component.valueChange.emit).toHaveBeenCalledWith([ mockChildren[0], mockChildren[1] ]);
  });
});
