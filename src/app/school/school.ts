

import {Entity} from "../entity/entity";

export class School extends Entity{


    constructor(public name: String, public medium: String){
      super('school');
    }

}
