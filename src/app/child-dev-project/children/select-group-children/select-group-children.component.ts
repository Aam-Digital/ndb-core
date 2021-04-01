import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Child } from "../model/child";
import { ChildrenService } from "../children.service";
import {
  FilterSelection,
  FilterSelectionOption,
} from "../../../core/filter/filter-selection/filter-selection";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * Use this component in your template to allow the user to select a group of children.
 */
@UntilDestroy()
@Component({
  selector: "app-select-group-children",
  templateUrl: "./select-group-children.component.html",
  styleUrls: ["./select-group-children.component.scss"],
})
export class SelectGroupChildrenComponent implements OnInit {
  @Output() valueChange = new EventEmitter<Child[]>();
  value: Child[] = [];

  children: Child[];

  centerFilters = new FilterSelection<Child>($localize`Center`, []);
  private selectedCenterFilter: FilterSelectionOption<Child>;

  schoolFilters = new FilterSelection<Child>($localize`Schools`, []);
  private selectedSchoolFilter: FilterSelectionOption<Child>;

  classFilters = new FilterSelection<Child>($localize`Classes`, []);
  private selectedClassFilter: FilterSelectionOption<Child>;

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    this.childrenService
      .getChildren()
      .pipe(untilDestroyed(this))
      .subscribe((children) => {
        this.children = children.filter((c) => c.isActive);
        this.centerFilters.options = this.loadCenterFilterOptions(
          this.children
        );
      });
  }

  private loadCenterFilterOptions(children: Child[]) {
    const options = [this.getAllStudentsFilterOption()];
    children
      .map((c) => c.center)
      .forEach((center) => {
        if (!center) {
          return;
        }

        const filterOption = {
          key: center.id,
          label: center.label,
          type: "valueFilter",
          filterFun: (c: Child) => c.center === center,
        };
        options.push(filterOption);
      });
    return options;
  }

  private loadFilterOptionsForProperty(
    children: Child[],
    propertyToBeFiltered: string
  ) {
    const options = [this.getAllStudentsFilterOption()];
    children
      .map((c) => c[propertyToBeFiltered])
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .forEach((id) => {
        if (!id) {
          return;
        }

        const filterOption = {
          key: id,
          label: id,
          type: "valueFilter",
          filterFun: (c: Child) => c[propertyToBeFiltered] === id,
        };
        options.push(filterOption);
      });
    return options;
  }

  private getAllStudentsFilterOption(): FilterSelectionOption<Child> {
    return {
      key: "all",
      label: $localize`All Students`,
      filterFun: () => true,
    };
  }

  selectCenterFilter(group: FilterSelectionOption<Child>) {
    this.selectedCenterFilter = group;
    this.value = this.children.filter(this.selectedCenterFilter.filterFun);

    this.schoolFilters.options = this.loadFilterOptionsForProperty(
      this.value,
      "schoolId"
    );
    this.selectSchoolFilter(this.schoolFilters.options[0]); // reset to the default "All Students" filter
  }

  selectSchoolFilter(group: FilterSelectionOption<Child>) {
    this.selectedSchoolFilter = group;
    this.value = this.children
      .filter(this.selectedCenterFilter.filterFun)
      .filter(this.selectedSchoolFilter.filterFun);

    this.classFilters.options = this.loadFilterOptionsForProperty(
      this.value,
      "schoolClass"
    );
    this.selectClassFilter(this.classFilters.options[0]); // reset to the default "All Students" filter
  }

  selectClassFilter(group: FilterSelectionOption<Child>) {
    this.selectedClassFilter = group;
    this.value = this.children
      .filter(this.selectedCenterFilter.filterFun)
      .filter(this.selectedSchoolFilter.filterFun)
      .filter(this.selectedClassFilter.filterFun);
  }

  confirmSelectedChildren() {
    this.valueChange.emit(this.value);
  }
}
