import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { School } from "../model/school";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

@UntilDestroy()
@Component({
  selector: "app-school-select",
  templateUrl: "./school-select.component.html",
  styleUrls: ["./school-select.component.scss"],
})
export class SchoolSelectComponent implements OnChanges {
  searchText = "";
  suggestions: School[] = [];
  notSelectedSchools: School[] = [];
  selectedSchools: School[] = [];
  @Input() selectedSchoolIds: string[] = [];
  @Output() selectedSchoolIdsChange = new EventEmitter<string[]>();

  @Input() disabled: boolean;

  @ViewChild("inputField", { static: true })
  inputField: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(private entityMapper: EntityMapperService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("selectedSchoolIds")) {
      this.entityMapper.loadType<School>(School).then((schools) => {
        this.notSelectedSchools = [];
        this.selectedSchools = [];
        schools.forEach((school) => {
          (this.selectedSchoolIds.includes(school.getId())
            ? this.selectedSchools
            : this.notSelectedSchools
          ).push(school);
          this.search();
        });
      });
    }
  }

  search() {
    this.searchText = this.searchText.toLowerCase();
    this.suggestions = this.notSelectedSchools.filter((school) =>
      school.name.toLowerCase().includes(this.searchText)
    );
  }

  selectSchool(selected: School) {
    this.selectedSchools.push(selected);
    this.selectedSchoolIds.push(selected.getId());
    this.selectedSchoolIdsChange.emit(this.selectedSchoolIds);

    this.notSelectedSchools = this.notSelectedSchools.filter(
      (school) => school !== selected
    );

    this.searchText = "";
    this.inputField.nativeElement.value = "";
    this.inputField.nativeElement.blur();
    this.search();
  }

  unselectSchool(unselected: School) {
    this.selectedSchools = this.selectedSchools.filter(
      (school) => school !== unselected
    );
    this.selectedSchoolIds = this.selectedSchoolIds.filter(
      (schoolId) => schoolId !== unselected.getId()
    );
    this.notSelectedSchools.unshift(unselected);
    this.selectedSchoolIdsChange.emit(this.selectedSchoolIds);
    this.search();
  }
}
