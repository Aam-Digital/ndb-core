import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Child} from '../child';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {ChildrenService} from '../children.service';
import {AttendanceMonth} from '../attendance/attendance-month';
import {FilterSelection} from '../../ui-helper/filter-selection/filter-selection';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {Subscription} from 'rxjs';

export interface ColumnGroup {
  name: string;
  columns: string[];
}


@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit, OnDestroy {
  watcher: Subscription;
  activeMediaQuery = '';
  childrenList: Child[] = [];
  attendanceList = new Map<string, AttendanceMonth[]>();
  childrenDataSource = new MatTableDataSource();

  centerFS = new FilterSelection('center', []);
  dropoutFS = new FilterSelection('status', [
        {key: 'active', label: 'Current Project Children', filterFun: (c: Child) => c.isActive()},
        {key: 'dropout', label: 'Dropouts', filterFun: (c: Child) => !c.isActive()},
        {key: '', label: 'All', filterFun: () => true},
      ]);
  filterSelections = [
    this.dropoutFS,
    this.centerFS,
  ];


  @ViewChild(MatSort, { static: true }) sort: MatSort;
  columnGroupSelection = 'School Info';
  columnGroups: ColumnGroup[] = [
    { name: 'Basic Info', columns: ['projectNumber', 'name', 'age', 'gender', 'schoolClass', 'schoolId', 'center', 'status']},
    { name: 'School Info',
      columns: ['projectNumber', 'name', 'age', 'schoolClass', 'schoolId', 'attendance-school', 'attendance-coaching', 'motherTongue']},
    { name: 'Status', columns: ['projectNumber', 'name', 'center', 'status', 'admissionDate',
      'has_aadhar', 'has_kanyashree', 'has_bankAccount', 'has_rationCard', 'has_bplCard']},
    { name: 'Health', columns: ['projectNumber', 'name', 'center',
      'health_vaccinationStatus', 'health_bloodGroup', 'health_eyeHealthStatus',
      'health_LastEyeCheckup', 'health_LastDentalCheckup', 'health_LastENTCheckup', 'health_LastVitaminD', 'health_LastDeworming',
      'gender', 'age', 'dateOfBirth']},
    { name: 'Mobile', columns : ['projectNumber', 'name', 'age', 'schoolId']}
  ];
  columnsToDisplay = ['projectNumber', 'name'];
  filterString = '';


  constructor(private childrenService: ChildrenService,
              private router: Router,
              private route: ActivatedRoute,
              private media: MediaObserver) {  }

  ngOnInit() {
    this.loadData();
    this.loadUrlParams();
    this.watcher = this.media.media$.subscribe((change: MediaChange) => {
      if (change.mqAlias === 'xs') {
        this.displayColumnGroup('Mobile');
      }
    });
  }

  private loadUrlParams(replaceUrl: boolean = false) {
    this.route.queryParams.subscribe(params => {
        this.columnGroupSelection = params['view'] ? params['view'] : this.columnGroupSelection;
        this.displayColumnGroup(this.columnGroupSelection);

        this.filterSelections.forEach(f => {
        f.selectedOption = params[f.name];
        if (f.selectedOption === undefined && f.options.length > 0) {
          f.selectedOption = f.options[0].key;
        }
      });
      this.applyFilterSelections(replaceUrl);
    });
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
  }


  private loadData(replaceUrl: boolean = false) {
    this.childrenService.getChildren().subscribe(children => {
      this.childrenList = children;
      const centers = children.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
      this.centerFS.initOptions(centers, 'center');

      this.applyFilterSelections(replaceUrl);
    });
    this.childrenService.getAttendances()
      .subscribe(results => this.prepareAttendanceData(results));
  }
/*
  private initCenterFilterOptions(centers: string[]) {
    const options = [{key: '', label: 'All', filterFun: (c: Child) => true}];

    centers.forEach(center => {
      options.push({key: center.toLowerCase(), label: center, filterFun: (c: Child) => c.center === center});
    });

    this.centerFS.options = options;
  } */


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

  displayColumnGroup(columnGroupName: string) {
    this.columnGroupSelection = columnGroupName;
    let found = false;
    let group: ColumnGroup;
    let i = 0;
    while (!found && i < this.columnGroups.length) {
       if (this.columnGroups[i].name === columnGroupName) {
         found = true;
         group = this.columnGroups[i];
       }
       i++;
    }
    this.columnsToDisplay = group.columns;
    this.updateUrl();
  }

  updateUrl(replaceUrl: boolean = false) {
    const params = {};
    this.filterSelections.forEach(f => {
      params[f.name] = f.selectedOption;
    });

    params['view'] = this.columnGroupSelection;

    this.router.navigate(['child'], { queryParams: params, replaceUrl: replaceUrl });
  }

  applyFilterSelections(replaceUrl: boolean = false) {
    let filteredData = this.childrenList;

    this.filterSelections.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;

    this.updateUrl(replaceUrl);
  }


  addChildClick() {
    this.router.navigate(['/child', 'new']);
  }


  showChildDetails(child: Child) {
    this.router.navigate(['/child', child.getId()]);
  }

  ngOnDestroy() {
    this.watcher.unsubscribe();
  }
}
