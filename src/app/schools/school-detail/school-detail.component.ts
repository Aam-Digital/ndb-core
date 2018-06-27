import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource, MatSort} from '@angular/material';
import {School} from '../school';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Child} from '../../children/child';

@Component({
  selector: 'app-school-detail',
  templateUrl: './school-detail.component.html',
  styleUrls: ['./school-detail.component.css']
})
export class SchoolDetailComponent implements OnInit, AfterViewInit {
  school: School;

  studentDataSource = new MatTableDataSource();
  displayedColumns = ['id', 'name', 'age'];
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.paramMap
      .subscribe(params => this.loadSchool(params.get('id')));
  }

  loadSchool(id: string) {
    this.entityMapper.load(School, id)
      .then(loadedEntities => this.school = loadedEntities)
      .then(() => this.entityMapper.loadType<Child>(Child))
      .then(children => {
        this.studentDataSource.data = children.filter(c => c.schoolId === this.school.getId());
      });
  }

  ngAfterViewInit() {
    this.studentDataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.studentDataSource.filter = filterValue;
  }

  studentClick(id: number) {
    let route: string;
    route = '/child/' + id;
    this.router.navigate([route]);
  }
}
