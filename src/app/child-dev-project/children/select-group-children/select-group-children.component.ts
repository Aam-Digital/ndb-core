import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Child } from '../model/child';
import { ChildrenService } from '../children.service';
import { FilterSelection, FilterSelectionOption } from '../../../core/ui-helper/filter-selection/filter-selection';


/**
 * Use this component in your template to allow the user to select a group of children.
 */
@Component({
  selector: 'app-select-group-children',
  templateUrl: './select-group-children.component.html',
  styleUrls: ['./select-group-children.component.scss'],
})
export class SelectGroupChildrenComponent implements OnInit {

  @Output() valueChange = new EventEmitter<Child[]>();

  private value: Child[] = [];
  centers: string[];
  children: Child[];
  studentGroupFilters = new FilterSelection<Child>('Groups', [ ]);

  constructor(
    private childrenService: ChildrenService,
  ) { }

  ngOnInit() {
    this.childrenService.getChildren().subscribe(children => {
      this.children = children.filter(c => c.isActive());
      this.centers = this.children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });
  }


  loadStudentGroupFilterForCenter(center: string) {
    this.studentGroupFilters.options = [ this.getAllSchoolsFilterOption(center) ];

    this.children
      .filter(c => c.center === center)
      .map(c => c.schoolId).filter((value, index, arr) => arr.indexOf(value) === index)
      .forEach(schoolId => {
        if (!schoolId) { return; }

        const filterOption = {
          key: schoolId,
          label: schoolId,
          type: 'school',
          filterFun: (c: Child) => c.schoolId === schoolId && c.center === center,
        };
        this.studentGroupFilters.options.push(filterOption);
      });
  }

  private getAllSchoolsFilterOption(center: string): FilterSelectionOption<Child> {
    return {
      key: 'all',
      label: 'All Students',
      filterFun: (c: Child) => c.center === center,
    };
  }


  updateSelectedChildren(group: FilterSelectionOption<Child>) {
    this.value = this.children.filter(group.filterFun);
    this.valueChange.emit(this.value);
  }
}
