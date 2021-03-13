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
import { Child } from "../model/child";
import { ChildrenService } from "../children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";

@UntilDestroy()
@Component({
  selector: "app-child-select",
  templateUrl: "./child-select.component.html",
  styleUrls: ["./child-select.component.scss"],
})
export class ChildSelectComponent implements OnChanges {
  searchText = "";
  showOnlyActiveChildren: boolean = true;
  suggestions = new Array<Child>();
  allChildren = new Array<Child>();
  selectedChildren = new Array<Child>();

  @Input() selectedChildrenIds: string[];
  @Output() selectedChildrenIdsChange = new EventEmitter<string[]>();
  @Input() disabled: boolean;
  @Output() newIdAdded = new EventEmitter<string>();
  @Output() idRemoved = new EventEmitter<string>();

  @ViewChild("inputField", { static: true })
  inputField: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("selectedChildrenIds")) {
      this.childrenService
        .getChildren()
        .pipe(untilDestroyed(this))
        .subscribe((children) => {
          this.allChildren = [];
          this.selectedChildren = [];
          children.forEach((child) => {
            (this.selectedChildrenIds.includes(child.getId())
              ? this.selectedChildren
              : this.allChildren
            ).push(child);
            this.search();
          });
        });
    }
  }

  search() {
    this.searchText = this.searchText.toLowerCase();

    this.suggestions = this.allChildren.filter((child) => {
      const key = "" + child.name + " " + child.projectNumber;
      if (this.showOnlyActiveChildren && !child.isActive) {
        return false;
      }
      return key.toLowerCase().includes(this.searchText);
    });
  }

  showAll() {
    this.showOnlyActiveChildren = false;
    this.search();
    setTimeout(() => this.autocomplete.openPanel());
  }

  selectChild(selected: Child) {
    this.selectedChildren.push(selected);
    this.selectedChildrenIds.push(selected.getId());
    this.selectedChildrenIdsChange.emit(this.selectedChildrenIds);
    this.newIdAdded.emit(selected.getId());
    this.allChildren = this.allChildren.filter((child) => child !== selected);

    this.searchText = "";
    this.inputField.nativeElement.value = "";
    this.inputField.nativeElement.blur();
    this.search();
  }

  unselectChild(unselected: Child) {
    this.selectedChildren = this.selectedChildren.filter(
      (child) => child !== unselected
    );
    this.selectedChildrenIds = this.selectedChildrenIds.filter(
      (childId) => childId !== unselected.getId()
    );
    this.selectedChildrenIdsChange.emit(this.selectedChildrenIds);
    this.idRemoved.emit(unselected.getId());
    this.allChildren.unshift(unselected);
  }

  unselectChildId(childId: string) {
    const child = this.selectedChildren.find((c) => c.getId() === childId);
    if (child) {
      this.unselectChild(child);
    }
  }
}
