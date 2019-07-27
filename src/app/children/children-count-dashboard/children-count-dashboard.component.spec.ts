import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenCountDashboardComponent } from './children-count-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {ChildrenService} from '../children.service';
import {RouterTestingModule} from '@angular/router/testing';
import {Child} from '../child';
import {Observable} from 'rxjs';

describe('ChildrenCountDashboardComponent', () => {
  let component: ChildrenCountDashboardComponent;
  let fixture: ComponentFixture<ChildrenCountDashboardComponent>;

  let childrenService;
  let childrenObserver;

  let _lastId = 0;
  function createChild(center: string) {
    _lastId++;
    const child = new Child(_lastId.toString());
    child.center = center;
    return child;
  }

  beforeEach(async(() => {
    childrenService = jasmine.createSpyObj(['getChildren']);
    childrenService.getChildren.and
      .returnValue(new Observable((observer) => { childrenObserver = observer; }));

    TestBed.configureTestingModule({
      declarations: [ ChildrenCountDashboardComponent ],
      imports: [
        MatIconModule,
        MatCardModule,
        RouterTestingModule,
      ],
      providers: [{ provide: ChildrenService, useValue: childrenService }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenCountDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totalChildren correctly', () => {
    const children = [createChild('CenterA'), createChild('CenterB'), createChild('CenterA')];
    childrenObserver.next(children);

    expect(component.totalChildren).toBe(3);
  });

  it('should calculate childrens per center correctly', () => {
    const centerA = 'CenterA';
    const centerB = 'CenterB';
    const children = [createChild(centerA), createChild(centerB), createChild(centerA)];
    childrenObserver.next(children);

    expect(component.childrenByCenter.length).toBe(2, 'unexpected number of centers');
    const actualCenterAEntry = component.childrenByCenter.filter(e => e[0] === centerA)[0];
    expect(actualCenterAEntry[1]).toBe(2, 'child count of CenterA not correct');
    const actualCenterBEntry = component.childrenByCenter.filter(e => e[0] === centerB)[0];
    expect(actualCenterBEntry[1]).toBe(1, 'child count of CenterB not correct');
  });

});
