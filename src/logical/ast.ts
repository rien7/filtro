import type { EnumFieldKind } from './field'
import type { OperatorKindFor, OperatorValueFor } from './operator'

export const FilterAstNode = {
  Condition: 'condition',
  Group: 'group',
} as const

export type EnumFilterAstNode = (typeof FilterAstNode)[keyof typeof FilterAstNode]

export type FilterCondition<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind> = OperatorKindFor<Kind>,
> = {
  type: typeof FilterAstNode.Condition
  field: FieldId
  kind: Kind
  operator: Op
  value: OperatorValueFor<Kind, Op>
}

export const FilterRelation = {
  AND: 'and',
  OR: 'or',
} as const

export type EnumFilterRelation = (typeof FilterRelation)[keyof typeof FilterRelation]

export type FilterGroup<FieldId extends string = string> = {
  type: typeof FilterAstNode.Group
  relation: EnumFilterRelation
  children: FilterNode<FieldId>[]
}

export type FilterNode<FieldId extends string = string>
  = | FilterGroup<FieldId>
    | FilterCondition<FieldId, EnumFieldKind>

export type FilterRoot<FieldId extends string = string> = FilterGroup<FieldId> & {
  relation: typeof FilterRelation.AND
}
