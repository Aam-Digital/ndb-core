import {
  Component,
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

  @Input() valueAsIds: string[];
  @Input() disabled: boolean;
  @Output() valueAsIdsChange = new EventEmitter();
  @Output() newIdAdded = new EventEmitter();
  @Output() idRemoved = new EventEmitter();

  @ViewChild("inputField", { static: true }) inputField;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(private childrenService: ChildrenService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("valueAsIds")) {
      this.loadInitial();
    }
  }

  private loadInitial() {
    this.childrenService
      .getChildren()
      .pipe(untilDestroyed(this))
      .subscribe((children) => {
        this.allChildren = [...children]; // clone array
        this.search();

        this.selectInitialSelectedChildren();
      });
  }

  private selectInitialSelectedChildren() {
    if (this.valueAsIds === undefined) {
      return;
    }

    this.selectedChildren = [];

    this.valueAsIds.forEach((selectedId) => {
      const selectedChild: Child = this.allChildren.find(
        (c) => c.getId() === selectedId
      );
      if (selectedChild) {
        this.selectChild(selectedChild, true);
      }
    });
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

  selectChild(child: Child, suppressChangeEvent = false) {
    if (
      this.selectedChildren.findIndex((c) => c.getId() === child.getId()) !== -1
    ) {
      // skip if already selected
      return;
    }

    this.selectedChildren.push(child);
    if (!suppressChangeEvent) {
      this.newIdAdded.emit(child.getId());
      this.valueAsIdsChange.emit(this.selectedChildren.map((c) => c.getId()));
    }

    const i = this.allChildren.findIndex((e) => e.getId() === child.getId());
    this.allChildren.splice(i, 1);

    this.searchText = "";
    this.inputField.nativeElement.value = "";
  }

  unselectChild(child: Child) {
    if (this.disabled) {
      return;
    }

    const i = this.selectedChildren.findIndex(
      (e) => e.getId() === child.getId()
    );
    this.selectedChildren.splice(i, 1);
    this.allChildren.unshift(child);

    this.idRemoved.emit(child.getId());
    this.valueAsIdsChange.emit(this.selectedChildren.map((c) => c.getId()));
  }

  unselectChildId(childId: string) {
    const child = this.selectedChildren.find((c) => c.getId() === childId);
    if (child) {
      this.unselectChild(child);
    }
  }
}
