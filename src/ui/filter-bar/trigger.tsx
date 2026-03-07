import type { ReactNode } from "react";
import { FieldKind, type EnumFieldKind } from "@/logical/field";
import {
  CalendarIcon,
  CheckSquareIcon,
  HashIcon,
  ListChecksIcon,
  ToggleLeftIcon,
  TypeIcon,
} from "lucide-react";
import type {
  SelectKind,
  SelectOption,
  SelectUIField,
  UIFieldForKind,
} from "@/ui/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/ui/baseui/dropdown-menu";
import type { MenuTrigger } from "@base-ui/react";
import { type FilterBarValueType, useFilterBar } from "@/ui/filter-bar/context";
import { createFilterBarValue, upsertFilterBarValue } from "@/ui/filter-bar/state";

function isSelectionKind<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
): field is Extract<
  UIFieldForKind<FieldId, Kind>,
  SelectUIField<FieldId, SelectKind>
> {
  return field.kind === FieldKind.select || field.kind === FieldKind.multiSelect
}

const DEFAULT_FIELD_ICON_MAPPING: Record<EnumFieldKind, ReactNode> = {
  [FieldKind.string]: <TypeIcon />,
  [FieldKind.number]: <HashIcon />,
  [FieldKind.date]: <CalendarIcon />,
  [FieldKind.select]: <CheckSquareIcon />,
  [FieldKind.multiSelect]: <ListChecksIcon />,
  [FieldKind.boolean]: <ToggleLeftIcon />,
};

function resolveIconMapping(
  mapping: boolean | Partial<Record<EnumFieldKind, ReactNode>>,
): Partial<Record<EnumFieldKind, ReactNode>> | null {
  if (mapping === true) {
    return DEFAULT_FIELD_ICON_MAPPING;
  }
  if (mapping && typeof mapping === "object") {
    return mapping;
  }
  return null;
}

function renderFieldIcon<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
  defaultIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null,
): ReactNode {
  if (field.icon !== undefined) {
    return field.icon;
  }

  if (!defaultIconMapping) return null;
  return defaultIconMapping[field.kind] ?? null;
}

function renderSelectOption<FieldId extends string, Kind extends SelectKind>({
  field,
  option,
  keyPath,
  onSelect,
}: {
  field: SelectUIField<FieldId, Kind>;
  option: SelectOption;
  keyPath: string;
  onSelect: (field: SelectUIField<FieldId, Kind>, value: string) => void;
}): ReactNode {
  const hasChildren = !!option.children?.length;
  if (!hasChildren) {
    return (
      <DropdownMenuItem key={keyPath} onClick={() => onSelect(field, option.value)}>
        {option.prefix}
        {option.label}
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub key={keyPath}>
      <DropdownMenuSubTrigger>
        {option.prefix}
        {option.label}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {option.children?.map((child, index) =>
            renderSelectOption({
              field,
              option: child,
              keyPath: `${keyPath}.${index}`,
              onSelect,
            }),
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

export function FilterBarTrigger({
  iconMapping = false,
  children,
  ...props
}: MenuTrigger.Props & {
  iconMapping: Partial<Record<EnumFieldKind, ReactNode>> | boolean
}) {
  const { uiFields, values, setValues } = useFilterBar()
  const resolvedIconMapping = resolveIconMapping(iconMapping);
  const activeFieldIds = new Set(values.map((value) => value.fieldId));
  const availableFields = uiFields.filter((uiField) => !activeFieldIds.has(uiField.id));

  const handleSelectField = <FieldId extends string, Kind extends SelectKind>(
    field: SelectUIField<FieldId, Kind>,
    value: string,
  ) => {
    const nextValue = createFilterBarValue(field, value);

    if (!nextValue) {
      return;
    }

    setValues?.((prev) =>
      upsertFilterBarValue(prev, nextValue as unknown as FilterBarValueType[number]),
    )
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...props}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableFields.map((uiField) => {
          return isSelectionKind(uiField) ? (
            <DropdownMenuSub key={uiField.id}>
              <DropdownMenuSubTrigger>
                {renderFieldIcon(uiField, resolvedIconMapping)}
                {uiField.label ?? uiField.id}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {typeof uiField.options === 'function'
                    ? undefined
                    : uiField.options?.map((option, index) =>
                      renderSelectOption({
                        field: uiField,
                        option,
                        keyPath: `${String(uiField.id)}.${index}`,
                        onSelect: handleSelectField,
                      }),
                    )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem key={uiField.id} onClick={() => {
              const nextValue = createFilterBarValue(uiField);

              if (!nextValue) {
                return;
              }

                setValues?.((prev) =>
                  upsertFilterBarValue(prev, nextValue as unknown as FilterBarValueType[number]),
                )
            }}>
              {renderFieldIcon(uiField, resolvedIconMapping)}
              {uiField.label ?? uiField.id}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
