import { Popover } from "@base-ui/react/popover";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import {
  DateOperatorKind,
  type DateOperatorValue,
  type EnumDateOperatorKind,
} from "../src/logical/operator";
import { Calendar } from "../src/ui/baseui/calendar";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type PlaygroundDateValue = DateOperatorValue[EnumDateOperatorKind];

export interface PlaygroundCalendarDateEditorProps {
  op: EnumDateOperatorKind;
  value: PlaygroundDateValue;
  onChange: (value: PlaygroundDateValue) => void;
}

const DATE_OPERATOR_LABELS: Record<EnumDateOperatorKind, string> = {
  [DateOperatorKind.eq]: "On date",
  [DateOperatorKind.before]: "Before date",
  [DateOperatorKind.after]: "After date",
  [DateOperatorKind.between]: "Select range",
  [DateOperatorKind.notBetween]: "Exclude range",
  [DateOperatorKind.lastNDays]: "Last N days",
  [DateOperatorKind.nextNDays]: "Next N days",
  [DateOperatorKind.isEmpty]: "Empty",
  [DateOperatorKind.isNotEmpty]: "Not empty",
};

export function PlaygroundCalendarDateEditor({
  op,
  value,
  onChange,
}: PlaygroundCalendarDateEditorProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(op, value));
  const isRange = isRangeOperator(op);
  const isRelative = isRelativeOperator(op);
  const triggerLabel = useMemo(() => getTriggerLabel(op, value), [op, value]);
  const selectedRange = isRange ? toDateRange(value) : undefined;
  const selectedDate = !isRange ? parseDateValue(getSingleValue(value)) : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    setVisibleMonth(getInitialMonth(op, value));
  }, [open, op, value]);

  if (isRelative) {
    const numericValue = typeof value === "number" ? value : 7;

    return (
      <label className="demo-date-number-field">
        <span className="demo-date-number-label">{DATE_OPERATOR_LABELS[op]}</span>
        <input
          className="demo-date-number-input"
          type="number"
          min="1"
          value={numericValue}
          onChange={(event) => onChange(Math.max(1, Number(event.currentTarget.value || 1)))}
        />
      </label>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="demo-date-trigger">
        <span className="demo-date-trigger-text">{triggerLabel}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align="start" className="demo-date-positioner">
          <Popover.Popup initialFocus={false} className="demo-date-popup filtro-popup-motion">
            <Calendar
              className="demo-date-calendar"
              mode={isRange ? "range" : "single"}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              numberOfMonths={1}
              selected={isRange ? selectedRange : selectedDate}
              onSelect={(selection) => {
                if (isRange) {
                  const nextRange = selection as DateRange | undefined;
                  const from = nextRange?.from;
                  const to = nextRange?.to ?? nextRange?.from;

                  if (!from || !to) {
                    return;
                  }

                  onChange(sortDateRange(formatDateValue(from), formatDateValue(to)));
                  setOpen(false);
                  return;
                }

                const nextDate = selection as Date | undefined;
                if (!nextDate) {
                  return;
                }

                onChange(formatDateValue(nextDate));
                setOpen(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function getTriggerLabel(op: EnumDateOperatorKind, value: PlaygroundDateValue) {
  if (isRangeOperator(op)) {
    const [start, end] = getRangeValue(value);
    return `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
  }

  if (typeof value === "string") {
    return formatDateLabel(value);
  }

  return DATE_OPERATOR_LABELS[op];
}

function getSingleValue(value: PlaygroundDateValue) {
  return typeof value === "string" ? value : getTodayValue();
}

function getRangeValue(value: PlaygroundDateValue) {
  if (!Array.isArray(value)) {
    const today = getTodayValue();
    return [today, today] as [string, string];
  }

  return sortDateRange(value[0] ?? getTodayValue(), value[1] ?? getTodayValue());
}

function toDateRange(value: PlaygroundDateValue) {
  const [start, end] = getRangeValue(value);
  return {
    from: parseDateValue(start),
    to: parseDateValue(end),
  } satisfies DateRange;
}

function getInitialMonth(op: EnumDateOperatorKind, value: PlaygroundDateValue) {
  if (isRangeOperator(op)) {
    return startOfMonth(parseDateValue(getRangeValue(value)[0]));
  }

  return startOfMonth(parseDateValue(getSingleValue(value)));
}

function isRangeOperator(op: EnumDateOperatorKind) {
  return op === DateOperatorKind.between || op === DateOperatorKind.notBetween;
}

function isRelativeOperator(op: EnumDateOperatorKind) {
  return op === DateOperatorKind.lastNDays || op === DateOperatorKind.nextNDays;
}

function getTodayValue() {
  return formatDateValue(new Date());
}

function sortDateRange(start: string, end: string) {
  return start <= end ? [start, end] as [string, string] : [end, start] as [string, string];
}

function formatDateLabel(value: string) {
  return DAY_FORMATTER.format(parseDateValue(value));
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
