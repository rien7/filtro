import type {
  SafeParseFailure,
  SafeParseSchema,
  SafeParseSchemaResolver,
  UIFieldForKind,
  UIFieldValidationResult,
} from '@/filter-bar/types'
import type { EnumFieldKind } from '@/logical/field'
import type { OperatorKindFor, OperatorValueFor } from '@/logical/operator'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeValidationResult(
  result: UIFieldValidationResult,
): string | null {
  if (!isNonEmptyString(result)) {
    return null
  }

  return result.trim()
}

export function resolveSafeParseSchema<Kind extends EnumFieldKind>(
  resolver: SafeParseSchemaResolver<Kind>,
  op: OperatorKindFor<Kind>,
): SafeParseSchema {
  return typeof resolver === 'function' ? resolver({ op }) : resolver
}

export function getSafeParseErrorMessage(error: SafeParseFailure['error']) {
  const firstIssue = error.issues?.find(issue => isNonEmptyString(issue.message))

  if (firstIssue?.message) {
    return firstIssue.message.trim()
  }

  if (isNonEmptyString(error.message)) {
    return error.message.trim()
  }

  return 'Invalid value'
}

export function validateFieldValue<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind>,
>({
  field,
  op,
  value,
}: {
  field: UIFieldForKind<FieldId, Kind>
  op: Op
  value: OperatorValueFor<Kind, Op> | null
}) {
  const validators = field.validators ?? []

  for (const validator of validators) {
    const nextMessage = normalizeValidationResult(
      validator({
        op,
        value,
      }),
    )

    if (nextMessage) {
      return nextMessage
    }
  }

  return null
}
