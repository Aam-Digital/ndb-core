import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Child} from '../child';
import {ChildrenService} from '../children.service';

@Component({
  selector: 'app-child-select',
  templateUrl: './child-select.component.html',
  styleUrls: ['./child-select.component.scss']
})
export class ChildSelectComponent implements OnInit {
  searchText = '';
  suggestions = new Array<Child>();
  allChildren = new Array<Child>();
  selectedChildren = new Array<Child>();

  @Input() valueAsIds: string[];
  @Output() valueAsIdsChange = new EventEmitter();

  @ViewChild('inputField', { static: true }) inputField;

  constructor(private childrenService: ChildrenService) { }

  ngOnInit() {
    this.childrenService.getChildren()
      .subscribe(children => {
        this.allChildren = children;
        this.suggestions = this.allChildren;

        this.selectInitialSelectedChildren();
      });
  }

  private selectInitialSelectedChildren() {
    if (this.valueAsIds === undefined) {
      return;
    }

    this.valueAsIds.forEach(selectedId => {
      const selectedChild: Child = this.allChildren.find(c => c.getId() === selectedId);
      if (selectedChild) {
        this.selectChild(selectedChild, true);
      }
    });
  }


  search() {
    this.searchText = this.searchText.toLowerCase();

    this.suggestions = this.allChildren.filter(child => {
      const key = '' + child.name + ' ' + child.projectNumber;
      return key.toLowerCase().includes(this.searchText);
    });
  }


  selectChild(child: Child, suppressChangeEvent = false) {
    this.selectedChildren.push(child);
    if (!suppressChangeEvent) {
      this.valueAsIdsChange.emit(this.selectedChildren.map(c => c.getId()));
    }

    const i = this.allChildren.findIndex(e => e.getId() === child.getId());
    this.allChildren.splice(i, 1);

    this.searchText = '';
    this.inputField.nativeElement.value = '';
  }

  unselectChild(child: Child) {
    const i = this.selectedChildren.findIndex(e => e.getId() === child.getId());
    this.selectedChildren.splice(i, 1);
    this.valueAsIdsChange.emit(this.selectedChildren.map(c => c.getId()));

    this.allChildren.unshift(child);
  }

}
