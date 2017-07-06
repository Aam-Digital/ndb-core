import { Component, OnInit } from '@angular/core';
import { Child } from '../child';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { Ng2TableModule } from 'ng2-table/ng2-table'; //Import Module for Child-List-Table


@Component({
  selector: 'app-child-list',
  templateUrl: './child-list.component.html',
  styleUrls: ['./child-list.component.css']
})
export class ChildListComponent implements OnInit {

    private data: Array<any> = [];
    public rows: Array<any> = [];
    public columns: Array<any> = [
        {
          title: "PNo", //Coloumn Header
          name: "PNo", //property name in data
          filtering: {
            filterString: '', //default value for filter
            placeholder: 'Filter by PNo' //placeholder for filter input 
          }
        },
        {
          title: "Name",
          name: "name",
          filtering: {
            filterString: '', placeholder: "Filter by Name"
          }
        },
        {
          title: "Center",
          name: "center",
        },
        {
          title: "Class",
          name: "class"
        },
        {
          title: "Resp. Social Worker",
          name: "social worker"
        }
    ]

    public page:number = 1;
    public itemsPerPage:number = 15;
    public maxSize:number = 3;
    public numPages:number = 10;
    public length:number = 0;

    public config:any = {
    paging: true, //switch on paging plugin
    sorting: {columns: this.columns}, //switch sorting to default-true
    filtering: {filterString: ''}, //switch filter to default-true
    className: ['table-striped', 'table-bordered'] //additional css classes
  };
  
    constructor( public entityMapperService: EntityMapperService){
      this.entityMapperService.loadAll(new Child('child')).then(
        data => {this.data = data; this.rows=this.data;
        }
        );
      this.length=this.data.length;
     
    }


    ngOnInit(){
   
    }

    public changePage(page:any, data:Array<any> = this.data):Array<any> {
    let start = (page.page - 1) * page.itemsPerPage;
    let end = page.itemsPerPage > -1 ? (start + page.itemsPerPage) : data.length;
    return data.slice(start, end);
    }
  
  public changeSort(data:any, config:any):any {
    if (!config.sorting) {
      return data;
    }

    let columns = this.config.sorting.columns || [];
    let columnName:string = void 0;
    let sort:string = void 0;

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].sort !== '' && columns[i].sort !== false) {
        columnName = columns[i].name;
        sort = columns[i].sort;
      }
    }

    if (!columnName) {
      return data;
    }

    // simple sorting
    return data.sort((previous:any, current:any) => {
      if (previous[columnName] > current[columnName]) {
        return sort === 'desc' ? -1 : 1;
      } else if (previous[columnName] < current[columnName]) {
        return sort === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }

   public changeFilter(data:any, config:any):any {
    let filteredData:Array<any> = data;
    this.columns.forEach((column:any) => {
      if (column.filtering) {
        filteredData = filteredData.filter((item:any) => {
          return item[column.name].match(column.filtering.filterString);
        });
      }
    });

    if (!config.filtering) {
      return filteredData;
    }

    if (config.filtering.columnName) {
      return filteredData.filter((item:any) =>
        item[config.filtering.columnName].match(this.config.filtering.filterString));
    }

    let tempArray:Array<any> = [];
    filteredData.forEach((item:any) => {
      let flag = false;
      this.columns.forEach((column:any) => {
        if (item[column.name].toString().match(this.config.filtering.filterString)) {
          flag = true;
        }
      });
      if (flag) {
        tempArray.push(item);
      }
    });
    filteredData = tempArray;

    return filteredData;
  }

    public onChangeTable(config:any, page:any = {page: this.page, itemsPerPage: this.itemsPerPage}):any {
    
    
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }

    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }

    
    let filteredData = this.changeFilter(this.data, this.config);
    let sortedData = this.changeSort(filteredData, this.config);
    this.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
    this.length = sortedData.length;
  }

  public onCellClick(data: any): any {
    console.log(data);
  }


}