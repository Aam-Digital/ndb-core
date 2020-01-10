import { Component, OnInit } from '@angular/core';
import {Database} from '../../database/database';
import {Child} from '../../../child-dev-project/children/model/child';
import {School} from '../../../child-dev-project/schools/model/school';
import {Entity} from '../../entity/entity';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  results;
  searchText = '';
  showSearchToolbar = false;

  constructor(
    private db: Database,
    private entitySchemaService: EntitySchemaService,
  ) { }

  ngOnInit() {
    this.createSearchIndex();
  }

  private createSearchIndex() {
    // `emit(x)` to add x as a key to the index that can be searched
    const searchMapFunction = 'function searchMapFunction (doc) {' +
      'if (doc.hasOwnProperty("searchIndices")) { doc.searchIndices.forEach(word => emit(word.toString().toLowerCase())) }' +
      '}';

    const designDoc = {
      _id: '_design/search_index',
      views: {
        by_name: {
          map: searchMapFunction
        }
      }
    };

    this.db.saveDatabaseIndex(designDoc);
  }


  async search() {
    this.searchText = this.searchText.toLowerCase();

    const searchHash = JSON.stringify(this.searchText);
    const searchTerms = this.searchText.split(' ');
    const queryResults = await this.db.query(
      'search_index/by_name',
      {startkey: searchTerms[0], endkey: searchTerms[0] + '\ufff0', include_docs: true}
      );

    if (JSON.stringify(this.searchText) === searchHash) {
      // only set result if the user hasn't continued typing and change the search term already
      this.results = this.prepareResults(queryResults.rows, searchTerms);
    }
  }

  private prepareResults(rows, searchTerms: string[]) {
    let results = this.parseRows(rows);
    results = results.filter(r => r !== undefined);
    results = results.filter(r => this.containsSecondarySearchTerms(r, searchTerms));
    results = results.sort((a, b) => this.sortResults(a, b));
    return results;
  }

  private parseRows(rows): Entity[] {
    const resultEntities = [];
    for (const r of rows) {
      let resultEntity: Entity;
      if (r.doc._id.startsWith(Child.ENTITY_TYPE + ':')) {
        resultEntity = new Child(r.doc.entityId);
      } else if (r.doc._id.startsWith(School.ENTITY_TYPE + ':')) {
        resultEntity = new School(r.doc.entityId);
      } else {
        return;
      }

      this.entitySchemaService.loadDataIntoEntity(resultEntity, r.doc);
      resultEntities.push(resultEntity);
    }
    return resultEntities;
  }

  private containsSecondarySearchTerms(item, searchTerms: string[]) {
    const itemKey = item.generateSearchIndices().join(' ').toLowerCase();
    for (let i = 1; i < searchTerms.length; i++) {
      if (!itemKey.includes(searchTerms[i])) {
        return false;
      }
    }
    return true;
  }

  private sortResults(a, b) {
    const entityComparison = this.compareEntityTypes(a, b);
    if (entityComparison === 0) {
      return a.toString().localeCompare(b.toString());
    } else {
      return entityComparison;
    }
  }

  private compareEntityTypes(a: Entity, b: Entity) {
    const e = [a, b];
    const t = [a.getType(), b.getType()];

    // special sorting for Child entities
    for (let i = 0; i < 2; i++) {
      if (e[i].getType() === Child.ENTITY_TYPE) {
        if ((e[i] as Child).isActive()) {
          // show first
          t[i] = '!' + t[i];
        } else {
          // show last
          t[i] = '\ufff0' + t[i];
        }
      }
    }

    return t[0].localeCompare(t[1]);
  }




  clickOption(optionElement) {
    // simulate a click on the EntityBlock inside the selected option element
    optionElement._element.nativeElement.children['0'].children['0'].click();
    if (this.showSearchToolbar === true) {
      this.showSearchToolbar = false;
    }
  }

  toggleSearchToolbar() {
    this.showSearchToolbar = !this.showSearchToolbar;
  }
}
