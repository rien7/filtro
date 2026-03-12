import type { FilterValueEditorProps } from '@/filter-bar/components/items/editors/shared'
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@/filter-bar/internal/primitives/baseui/segmented-control'
import { filterBarThemeSlot, useFilterBarTheme } from '@/filter-bar/theme'
import type { FieldKind } from '@/logical/field'

export function BooleanValueEditor<FieldId extends string>({
  field,
  item,
  onChange,
}: FilterValueEditorProps<FieldId, typeof FieldKind.boolean>) {
  const theme = useFilterBarTheme()
  const trueLabel = field.options?.[0].label ?? theme.texts.booleanTrueFallback
  const falseLabel = field.options?.[1].label ?? theme.texts.booleanFalseFallback
  const value = typeof item.value === 'boolean' ? item.value : undefined

  return (
    <div
      data-theme-slot={filterBarThemeSlot('editorRoot')}
      className={theme.classNames.editorRoot}
    >
      <div
        data-theme-slot={filterBarThemeSlot('editorSplit')}
        className={theme.classNames.editorSplit}
      >
        <SegmentedControl<boolean>
          value={value}
          aria-label={field.label ?? field.id}
          onValueChange={nextValue =>
            onChange(nextValue, { valueChangeKind: 'selected' })}
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem
            data-theme-slot={filterBarThemeSlot('booleanTrueButton')}
            className={theme.classNames.booleanTrueButton}
            value={true}
          >
            <SegmentedControlItemText>{trueLabel}</SegmentedControlItemText>
          </SegmentedControlItem>
          <SegmentedControlItem
            data-theme-slot={filterBarThemeSlot('booleanFalseButton')}
            className={theme.classNames.booleanFalseButton}
            value={false}
          >
            <SegmentedControlItemText>{falseLabel}</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  )
}
