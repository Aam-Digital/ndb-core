import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildBlockComponent } from './child-block.component';
import {RouterTestingModule} from '@angular/router/testing';
import {Child} from '../child';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import {MatIconModule} from '@angular/material';

describe('ChildBlockComponent', () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchoolBlockComponent, ChildBlockComponent ],
      imports: [RouterTestingModule, MatIconModule]
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
