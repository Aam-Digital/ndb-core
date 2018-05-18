import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';
import {Child} from '../child';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit {

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


  constructor(private entityMapper: EntityMapperService,
              private alertService: AlertService,
              private router: Router) { }

  ngOnInit() {
    this.displayColumnGroup(this.columnGroupSelection);
    this.displayFilteredList(this.filterGroupSelection);

    this.entityMapper.loadType<Child>(Child).then(
      loadedEntities => this.childrenDataSource.data = loadedEntities,
      reason => this.alertService.addWarning(reason)
    );
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
      // TODO this.childrenDataSource.data.filter(child: Child => child.isActive());
    } else if (filteredSelection === 'dropouts') {
      // TODO this.childrenDataSource.data.filter(child: Child => !child.isActive());
    }
  }
}
