import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Child} from '../child';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {ChildrenService} from '../children.service';
import {AttendanceMonth} from '../attendance/attendance-month';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList: Child[];
  attendanceList = new Map<string, AttendanceMonth[]>();
  childrenDataSource = new MatTableDataSource();
  centers: string[];

  @ViewChild(MatSort) sort: MatSort;
  columnGroupSelection = 'school';
  columnGroups = {
    'basic': ['pn', 'name', 'age', 'class', 'school', 'center', 'status'],
    'school': ['pn', 'name', 'age', 'class', 'school', 'attendance'],
    'status': ['pn', 'name', 'center', 'status'],
  };
  columnsToDisplay: ['pn', 'name'];

  filterString = '';
  dropoutFilterSelection = 'current';
  centerFilterSelection = '';
  filterFunctionDropout: (c: Child) => boolean = (c: Child) => true;
  filterFunctionCenter: (c: Child) => boolean = (c: Child) => true;


  constructor(private childrenService: ChildrenService,
              private router: Router,
              private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      const paramFilter = params.get('filter');
      this.filterString = paramFilter ? paramFilter : '';
      this.applyFilter(this.filterString);
    });

    this.childrenService.getChildren().subscribe(data => {
      this.childrenList = data;
      this.childrenDataSource.data = data;
      this.setDropoutFilteredList(this.dropoutFilterSelection);
      this.setCenterFilteredList(this.centerFilterSelection);

      this.centers = data.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
    });

    this.childrenService.getAttendances()
      .subscribe(results => this.prepareAttendanceData(results));
  }

  ngOnInit() {
    this.displayColumnGroup(this.columnGroupSelection);
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
  }


  prepareAttendanceData(loadedEntities: AttendanceMonth[]) {
    this.attendanceList = new Map<string, AttendanceMonth[]>();
    loadedEntities.forEach(x => {
      if (!this.attendanceList.has(x.student)) {
        this.attendanceList.set(x.student, new Array<AttendanceMonth>());
      }
      this.attendanceList.get(x.student).push(x);
    });

    this.attendanceList.forEach(studentsAttendance => {
      studentsAttendance.sort((a, b) => {
        // descending by date
        if (a.month > b.month) { return -1; }
        if (a.month < b.month) { return 1; }
        return 0;
      });
    });
  }


  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
  }


  showChildDetails(child: Child) {
    this.router.navigate(['/child', child.getId()]);
  }

  displayColumnGroup(columnGroup: string) {
    this.columnsToDisplay = this.columnGroups[columnGroup];
  }

  applyFilterGroups() {
    this.childrenDataSource.data = this.childrenList
      .filter(this.filterFunctionDropout)
      .filter(this.filterFunctionCenter);
  }

  setDropoutFilteredList(filteredSelection: string) {
    if (filteredSelection === 'current') {
      this.filterFunctionDropout = (c) => c.isActive();
    } else if (filteredSelection === 'dropouts') {
      this.filterFunctionDropout = (c) => !c.isActive();
    } else {
      this.filterFunctionDropout = (c) => true;
    }

    this.applyFilterGroups();
  }

  setCenterFilteredList(filteredSelection: string) {
    if (filteredSelection === '') {
      this.filterFunctionCenter = (c: Child) => true;
    } else {
      this.filterFunctionCenter = (c: Child) => c.center === filteredSelection;
    }

    this.applyFilterGroups();
  }

  addChildClick() {
    let route: string;
    route = this.router.url + '/new';
    this.router.navigate([route]);
  }
}
