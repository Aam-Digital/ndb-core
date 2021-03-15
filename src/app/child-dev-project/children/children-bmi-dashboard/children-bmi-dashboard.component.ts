import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { HealthCheck } from 'app/child-dev-project/health-checkup/model/health-check';
import { WarningLevel } from 'app/child-dev-project/warning-level';
import { OnInitDynamicComponent } from 'app/core/view/dynamic-components/on-init-dynamic-component.interface';
import { take } from 'rxjs/operators';
import { ChildrenService } from '../children.service';
import { Child } from '../model/child';

interface bmiRow {
  childId: string,
  bmi: number
}

@Component({
  selector: 'app-children-bmi-dashboard',
  templateUrl: './children-bmi-dashboard.component.html',
  styleUrls: ['./children-bmi-dashboard.component.scss']
})
export class ChildrenBmiDashboardComponent implements OnInit, OnInitDynamicComponent {
  public currentHealthCheck: HealthCheck;
  bmiRows: bmiRow [] = [];

  constructor(
    private childrenService: ChildrenService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.childrenService.getChildren()
      .pipe(take(1))
      .subscribe((results)=>{
        this.filterBMI(results)
      })
  }

  onInitFromDynamicConfig(config: any){

  }

  filterBMI(children: Child[]) {
    
    children.forEach((child)=>{
      this.childrenService
        .getHealthChecksOfChild(child.getId())
        .pipe()
        .subscribe((results) => {
          /** get newest HealtCheck */
          if (results.length > 0) {
            this.currentHealthCheck = results.reduce((prev, cur) =>
              cur.date > prev.date ? cur : prev
            );
            /**Check health status */
            if (this.currentHealthCheck.getWarningLevel() === WarningLevel.URGENT) {
              this.bmiRows.push({childId: child.getId(),bmi: this.currentHealthCheck.bmi})
            }
          }
        });
    })
  }
  
  goToChild(childId: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, childId]);
  }

}
