import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Child} from '../child';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';
import {ChildrenService} from '../children.service';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList: Child[];
  childrenDataSource = new MatTableDataSource();

  @ViewChild(MatSort) sort: MatSort;
  columnGroupSelection = 'basic';
  columnGroups = {
    'basic': ['pn', 'name', 'age', 'class', 'school', 'center', 'status'],
    'school': ['pn', 'name', 'age', 'class', 'school'],
    'status': ['pn', 'name', 'center', 'status'],
  };
  columnsToDisplay: ['pn', 'name'];

  filterGroupSelection = 'current';


  constructor(private childrenService: ChildrenService,
              private router: Router) {
    const that = this;
    this.childrenService.getChildren().subscribe(data => {
      that.childrenList = data;
      that.childrenDataSource.data = data;
      that.displayFilteredList(that.filterGroupSelection);
    });
  }

  ngOnInit() {
    this.displayColumnGroup(this.columnGroupSelection);
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
  }


  showChildDetails(child: Child) {
    this.router.navigate(['/child', child.pn]);
  }

  displayColumnGroup(columnGroup: string) {
    this.columnsToDisplay = this.columnGroups[columnGroup];
  }

  displayFilteredList(filteredSelection: string) {
    if (filteredSelection === 'current') {
      this.childrenDataSource.data = this.childrenList.filter(c => c.isActive());
    } else if (filteredSelection === 'dropouts') {
      this.childrenDataSource.data = this.childrenList.filter(c => !c.isActive());
    }
  }
}
