import {
  DateOperatorKind,
  EmptyOperatorKind,
  MultiSelectOperatorKind,
  NumberOperatorKind,
  StringOperatorKind,
} from '@/logical/operator'

export const OPERATOR_LABELS: Record<string, string> = {
  eq: 'Is',
  between: 'Between',
  notBetween: 'Not between',
  [StringOperatorKind.startsWith]: 'Starts with',
  [StringOperatorKind.endsWith]: 'Ends with',
  [StringOperatorKind.contains]: 'Contains',
  [StringOperatorKind.notContains]: 'Does not contain',
  [NumberOperatorKind.gt]: 'Greater than',
  [NumberOperatorKind.lt]: 'Less than',
  [NumberOperatorKind.gte]: 'At least',
  [NumberOperatorKind.lte]: 'At most',
  [DateOperatorKind.before]: 'Before',
  [DateOperatorKind.after]: 'After',
  [DateOperatorKind.lastNDays]: 'In last N days',
  [DateOperatorKind.nextNDays]: 'In next N days',
  neq: 'Is not',
  in: 'Is any of',
  notIn: 'Is none of',
  [MultiSelectOperatorKind.hasAny]: 'Has any of',
  [MultiSelectOperatorKind.hasAll]: 'Has all of',
  [MultiSelectOperatorKind.hasNone]: 'Has none of',
  [EmptyOperatorKind.isEmpty]: 'Is empty',
  [EmptyOperatorKind.isNotEmpty]: 'Is not empty',
}

export function getOperatorLabel(operator: string) {
  return OPERATOR_LABELS[operator] ?? operator
}
