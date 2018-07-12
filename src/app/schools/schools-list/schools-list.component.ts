import {Component, OnInit, Output, EventEmitter, ViewChild, AfterViewInit} from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../school';
import {Router} from '@angular/router';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-schools',
  templateUrl: './schools-list.component.html',
  styleUrls: ['./schools-list.component.css']
})
export class SchoolsListComponent implements OnInit, AfterViewInit {
  schools: School[];
  school: School;

  dataSource = new MatTableDataSource();
  displayedColumns = ['name', 'address', 'medium'];
  @ViewChild(MatSort) sort: MatSort;
  @Output() showDetailsEvent = new EventEmitter<School>();

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router
  ) {}

  ngOnInit() {
    this.entityMapper.loadType<School>(School)
      .then(loadedEntities => this.dataSource.data = loadedEntities);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  showDetails(id) {
    let route: string;
    route = this.router.url + '/' + id;
    this.router.navigate([route]);
  }
}
