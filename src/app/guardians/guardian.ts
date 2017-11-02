import {Entity} from '../entity/entity';


export class Guardian extends Entity{

  constructor(private name: String, private relationship: String, private dateOfBirth: string, private moblieNumber: String, private remarks: String){
    super('guardian');
  }


}
