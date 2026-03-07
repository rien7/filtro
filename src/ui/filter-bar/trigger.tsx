import { Fragment, type ReactNode } from "react";
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
  UIFieldEntry,
  UIFieldForKind,
} from "@/ui/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/ui/baseui/dropdown-menu";
import type { MenuTrigger } from "@base-ui/react";
import { type FilterBarValueType, useFilterBar } from "@/ui/filter-bar/context";
import { useSelectOptions } from "@/ui/filter-bar/select-options";
import { createFilterBarValue, upsertFilterBarValue } from "@/ui/filter-bar/state";

function isSelectionKind<FieldId extends string, Kind extends EnumFieldKind>(
  field: UIFieldForKind<FieldId, Kind>,
): field is Extract<
  UIFieldForKind<FieldId, Kind>,
  SelectUIField<FieldId, SelectKind>
> {
  return field.kind === FieldKind.select || field.kind === FieldKind.multiSelect;
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

function renderFieldIcon(
  field: { icon?: ReactNode; kind: EnumFieldKind },
  defaultIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null,
): ReactNode {
  if (field.icon !== undefined) {
    return field.icon;
  }

  if (!defaultIconMapping) {
    return null;
  }

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

function TriggerSelectionField<FieldId extends string, Kind extends SelectKind>({
  field,
  handleSelectField,
  resolvedIconMapping,
}: {
  field: SelectUIField<FieldId, Kind>;
  handleSelectField: (field: SelectUIField<FieldId, Kind>, value: string) => void;
  resolvedIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null;
}) {
  const shouldLoadOnRender = field.optionsLoadMode === "render";
  const { error, isAsync, load, options, status } = useSelectOptions(field, shouldLoadOnRender);
  const resolvedOptions = isAsync ? options : (Array.isArray(field.options) ? field.options : []);

  return (
    <DropdownMenuSub
      key={field.id}
      onOpenChange={(open) => {
        if (!open || !isAsync || shouldLoadOnRender || status !== "idle") {
          return;
        }

        void load();
      }}
    >
      <DropdownMenuSubTrigger>
        {renderFieldIcon(field, resolvedIconMapping)}
        {field.label ?? field.id}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {status === "loading" ? (
            <DropdownMenuItem disabled>Loading options...</DropdownMenuItem>
          ) : status === "error" ? (
            <DropdownMenuItem disabled>
              {error?.message ?? "Failed to load options"}
            </DropdownMenuItem>
          ) : resolvedOptions.length > 0 ? (
            resolvedOptions.map((option: SelectOption, index: number) =>
              renderSelectOption({
                field,
                option,
                keyPath: `${String(field.id)}.${index}`,
                onSelect: handleSelectField,
              }),
            )
          ) : (
            <DropdownMenuItem disabled>No options</DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function renderFieldEntry<FieldId extends string, Kind extends EnumFieldKind>(
  uiField: UIFieldForKind<FieldId, Kind>,
  resolvedIconMapping: Partial<Record<EnumFieldKind, ReactNode>> | null,
  handleSelectField: <SelectedFieldId extends string, SelectedKind extends SelectKind>(
    field: SelectUIField<SelectedFieldId, SelectedKind>,
    value: string,
  ) => void,
  handleSelectValue: (field: UIFieldForKind<FieldId, Kind>) => void,
) {
  return isSelectionKind(uiField) ? (
    <TriggerSelectionField
      field={uiField}
      handleSelectField={handleSelectField}
      resolvedIconMapping={resolvedIconMapping}
    />
  ) : (
    <DropdownMenuItem key={uiField.id} onClick={() => handleSelectValue(uiField)}>
      {renderFieldIcon(uiField, resolvedIconMapping)}
      {uiField.label ?? uiField.id}
    </DropdownMenuItem>
  );
}

export function FilterBarTrigger({
  iconMapping = false,
  children,
  ...props
}: MenuTrigger.Props & {
  iconMapping: Partial<Record<EnumFieldKind, ReactNode>> | boolean;
}) {
  const { uiFieldEntries, values, setValues } = useFilterBar();
  const resolvedIconMapping = resolveIconMapping(iconMapping);
  const activeFieldIds = new Set(values.map((value) => value.fieldId));
  const availableEntries: UIFieldEntry[] = [];

  for (const entry of uiFieldEntries) {
    if ("fields" in entry) {
      const fields = entry.fields.filter((uiField) => !activeFieldIds.has(uiField.id));
      if (fields.length > 0) {
        availableEntries.push({ ...entry, fields });
      }
      continue;
    }

    if (!activeFieldIds.has(entry.id)) {
      availableEntries.push(entry);
    }
  }

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
    );
  };

  const handleSelectValue = (uiField: UIFieldForKind<string, EnumFieldKind>) => {
    if (isSelectionKind(uiField)) {
      return;
    }

    const nextValue = createFilterBarValue(uiField);

    if (!nextValue) {
      return;
    }

    setValues?.((prev) =>
      upsertFilterBarValue(prev, nextValue as unknown as FilterBarValueType[number]),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...props}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableEntries.map((entry, index) => (
          <Fragment key={"fields" in entry ? `group:${entry.label}` : `field:${entry.id}`}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            {"fields" in entry ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
                {entry.fields.map((uiField) =>
                  renderFieldEntry(
                    uiField,
                    resolvedIconMapping,
                    handleSelectField,
                    handleSelectValue,
                  ),
                )}
              </DropdownMenuGroup>
            ) : (
              renderFieldEntry(
                entry,
                resolvedIconMapping,
                handleSelectField,
                handleSelectValue,
              )
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
