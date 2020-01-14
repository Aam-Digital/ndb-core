import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keys',
})
export class KeysPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    const keys = [];
    for (const enumMember of Object.keys(value)) {
      keys.push({key: enumMember, value: value[enumMember]});
    }
    return keys;
  }

}
