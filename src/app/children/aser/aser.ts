/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Entity } from '../../entity/entity';
import {WarningLevel} from '../attendance/warning-level';


export class Aser extends Entity {
  static ENTITY_TYPE = 'Aser';

  static ReadingLevels = [
    'Nothing',
    'Read Letters',
    'Read Words',
    'Read Sentence',
    'Read Paragraph'
  ];
  static MathLevels = [
    'Nothing',
    'Numbers 1-9',
    'Numbers 10-99',
    'Subtraction',
    'Division'
  ];


  child: string; // id of Child entity
  date: Date;
  hindi = '';
  bengali = '';
  english = '';
  math = '';
  remarks = '';

  static isReadingPassedOrNA(level: string) {
    if (level === '' || level === undefined) {
      // not applicable
      return true;
    }
    if (level === this.ReadingLevels[4]) {
      // passed highest level
      return true;
    }
    return false;
  }
  static isMathPassedOrNA(level: string) {
    if (level === '' || level === undefined) {
      // not applicable
      return true;
    }
    if (level === this.MathLevels[4]) {
      // passed highest level
      return true;
    }
    return false;
  }


  public load(data: any) {
    if (data.date !== undefined && typeof data.date !== typeof new Date()) {
      data.date = new Date(data.date);
    }

    if (data.english === 'Read Story') {
      data.english = 'Read Paragraph';
    }
    if (data.hindi === 'Read Story') {
      data.hindi = 'Read Paragraph';
    }
    if (data.bengali === 'Read Story') {
      data.bengali = 'Read Paragraph';
    }
    if (data.english === 'Read Sentences') {
      data.english = 'Read Sentence';
    }
    if (data.hindi === 'Read Sentences') {
      data.hindi = 'Read Sentence';
    }
    if (data.bengali === 'Read Sentences') {
      data.bengali = 'Read Sentence';
    }
    if (data.english === 'Read Nothing') {
      data.english = 'Nothing';
    }
    if (data.hindi === 'Read Nothing') {
      data.hindi = 'Nothing';
    }
    if (data.bengali === 'Read Nothing') {
      data.bengali = 'Nothing';
    }
    if (data.math === 'Subraction') {
      data.math = 'Subtraction';
    }

    return super.load(data);
  }


  getWarningLevel (): WarningLevel {
    let warningLevel = WarningLevel.NONE;

    if (Aser.isReadingPassedOrNA(this.english) && Aser.isReadingPassedOrNA(this.hindi) && Aser.isReadingPassedOrNA(this.bengali)
        && Aser.isMathPassedOrNA(this.math)) {
      warningLevel = WarningLevel.OK;
    } else {
      warningLevel = WarningLevel.WARNING;
    }

    return warningLevel;
  }


  getWarningLevelReading (level): WarningLevel {
    switch (level) {
      case Aser.ReadingLevels[0]:
        return WarningLevel.URGENT;
      case Aser.ReadingLevels[1]:
        return WarningLevel.URGENT;
      case Aser.ReadingLevels[2]:
        return WarningLevel.WARNING;
      case Aser.ReadingLevels[3]:
        return WarningLevel.WARNING;
      case Aser.ReadingLevels[4]:
        return WarningLevel.OK;
    }
  }
  getWarningLevelMath (level): WarningLevel {
    switch (level) {
      case Aser.MathLevels[0]:
        return WarningLevel.URGENT;
      case Aser.MathLevels[1]:
        return WarningLevel.URGENT;
      case Aser.MathLevels[2]:
        return WarningLevel.URGENT;
      case Aser.MathLevels[3]:
        return WarningLevel.WARNING;
      case Aser.MathLevels[4]:
        return WarningLevel.OK;
    }
  }

}
