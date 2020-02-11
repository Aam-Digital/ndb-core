export enum WarningLevel {
  OK = 'OK',
  WARNING = 'WARNING',
  URGENT = 'URGENT',
  NONE = '',
}

export function WarningLevelColor(warningLevel: WarningLevel): string {
  switch (warningLevel) {
    case WarningLevel.OK:
      return '#90ee9040';
    case WarningLevel.WARNING:
      return '#ffa50080';
    case WarningLevel.URGENT:
      return '#fd727280';
    default:
      return '';
  }
}
