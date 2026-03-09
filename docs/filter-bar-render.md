# FilterBar Field `render`

`FilterBar` 允许你对单个字段的 value editor 做整段替换。

这不是“改默认输入框的一小部分样式”，而是直接接管该字段在 row 里的值编辑区域。

当前这套能力适合：

- 某个字段需要完全不同的交互
- 你想把默认输入框替换成自定义 popover / calendar / slider / 组合控件
- 你仍然想继续复用 `FilterBar` 的 field / operator / remove 行结构

不适合：

- 只想改默认 editor 的内部一个子节点
- 只想替换 popup content，但保留默认 trigger

当前 `render` API 给到的是整个 value editor 插槽，不是更细粒度的子 slot。

## 1. 最短用法

```tsx
import { FilterBar, filtro } from "filtro";

const fields = [
  filtro.string("keyword")
    .label("Keyword")
    .render(({ op, value, onChange, validate }) => {
      const currentValue = typeof value === "string" ? value : "";
      const error = validate(currentValue);

      return (
        <>
          <input
            value={currentValue}
            onChange={(event) =>
              onChange(event.currentTarget.value, {
                valueChangeKind: "typing",
              })
            }
          />
          {error ? <div>{error}</div> : null}
        </>
      );
    }),
];
```

`render` 收到的参数是：

- `op`: 当前 operator
- `value`: 当前 operator 对应的值，可能是 `null`
- `onChange`: 写回新值；可选第二个参数可声明 `valueChangeKind`
- `validate`: 复用当前字段的 `.validate()` / `.zod()` 规则

这几个值都来自当前 row 的内部状态。

要注意：

- `validate` 只负责跑字段规则
- 如果你的自定义控件需要保留非法 raw input，中间态仍然需要组件自己维护
- 内置 editor 的错误会显示在整条 item 底部；自定义 `render` 是否复用这套展示位置，仍由你的组件自己决定

默认 editor 内部已经做了这层处理；自定义 `render` 不会自动接管 raw input 状态。

## 2. `render` 接管的范围

`FilterBar` 的一行仍然分成几部分：

- field label
- operator
- value editor
- remove button

`render` 只替换其中的 value editor。

这意味着：

- 字段名仍然由 `FilterBar` 渲染
- operator 切换仍然由 `FilterBar` 渲染
- 删除按钮仍然由 `FilterBar` 渲染
- 只有值输入区域改成你的自定义实现

内部触发点在 [`src/filter-bar/items.value-editor.tsx`](https://github.com/rien7/filtro/blob/main/src/filter-bar/items.value-editor.tsx)。

当字段定义上存在 `render` 时，`FilterBar` 不会再走默认的 `StringValueEditor` / `DateValueEditor` / `SelectValueEditor` 这些内置 editor。

## 3. Date 字段示例

playground 里有一个 `Release Window` 示例字段：

[`playground/playground-app.tsx`](https://github.com/rien7/filtro/blob/main/playground/playground-app.tsx)

```tsx
filtro.date("releaseWindow")
  .label("Release Window")
  .render(({ op, value, onChange }) => (
    <PlaygroundCalendarDateEditor
      op={op}
      value={value}
      onChange={(nextValue) =>
        onChange(nextValue, {
          valueChangeKind: "selected",
        })
      }
    />
  ))
```

这里的思路是：

- date 字段仍然保留原本全部 operator
- `between/notBetween` 时，使用自定义范围选择
- `lastNDays/nextNDays` 时，使用数字输入
- 其余单值日期 operator，使用单日期选择

## 4. 示例里到底重写了什么

playground 的实现文件在：

[`playground/calendar-date-editor.tsx`](https://github.com/rien7/filtro/blob/main/playground/calendar-date-editor.tsx)

当前示例重写了 value editor 内部的全部内容：

- 自定义 trigger
- 自定义 `Popover`
- popup 内部放一个 playground 专用日历包装件

但它没有重写整条 row。

所以当前行为可以理解成：

- 外层 row 仍然是 `FilterBar`
- value editor 里面这一块改成了自己的组件

## 5. 范围选择怎么处理

date 字段在不同 operator 下的 value 类型并不一样：

- `eq` / `before` / `after`: `string`
- `between` / `notBetween`: `[string, string]`
- `lastNDays` / `nextNDays`: `number`

所以自定义 editor 里通常要先按 operator 分支。

playground 里用的是：

```tsx
const isRange = op === DateOperatorKind.between || op === DateOperatorKind.notBetween;
const isRelative =
  op === DateOperatorKind.lastNDays || op === DateOperatorKind.nextNDays;
```

相应地：

- `isRelative` 时渲染数字输入框
- `isRange` 时把 `[string, string]` 转成 `Calendar` 需要的 range 结构
- 其它情况把单个 `string` 转成单日期

示例里 `Calendar` 的关键写法是：

```tsx
<Calendar
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

      onChange(sortDateRange(formatDateValue(from), formatDateValue(to)), {
        valueChangeKind: "selected",
      });
      return;
    }

    const nextDate = selection as Date | undefined;
    if (!nextDate) {
      return;
    }

    onChange(formatDateValue(nextDate), {
      valueChangeKind: "selected",
    });
  }}
/>
```

这里要注意两点：

- playground 里的 `Calendar` 不是 `filtro` 导出的正式组件，而是 demo 自己的 `react-day-picker` 包装件
- `Calendar` 的 range 选择值不是 `[string, string]`，而是 `{ from?: Date; to?: Date }`
- 所以写回 `FilterBar` 前，需要再转换回 date operator 需要的字符串元组

## 5.1 `valueChangeKind` 的用法

如果你用了自定义 `render`，库不再知道这次值更新是：

- 连续输入
- 还是一次离散选择

因此推荐你自己显式声明：

- 文本 / 数字键盘输入：`{ valueChangeKind: "typing" }`
- 日期选择 / 下拉选择 / 按钮切换：`{ valueChangeKind: "selected" }`

如果你不传，当前实现会按 `selected` 处理。

## 6. 为什么默认 date editor 没有复用

默认 date editor 在：

[`src/filter-bar/items-editors/date-value-editor.tsx`](https://github.com/rien7/filtro/tree/main/src/filter-bar/items-editors/date-value-editor.tsx)

默认实现是：

- 单值日期用 `input[type="date"]`
- `between/notBetween` 用两个 `input[type="date"]`
- `lastNDays/nextNDays` 用数字输入

如果你的需求是：

- 只替换 date 的交互
- 但不影响别的字段

那么最稳妥的方式就是像 playground 这样，只对某一个字段声明 `render`。

## 7. 使用建议

- `render` 里优先只处理当前字段自己的交互，不要把更多 row 级逻辑搬进去。
- 先按 operator 把 value 类型分清楚，再写 UI。
- 自定义文本输入记得给 `onChange` 传 `valueChangeKind: "typing"`。
- 如果是 date / number 这种多 operator 多 value shape 的字段，先准备好类型转换函数。
- 如果需求已经变成“默认 editor 的 trigger / popup / content 需要分别开放”，说明现在的 `render` 粒度可能不够，应该考虑扩展更细的 slot，而不是继续把逻辑塞进单个 `render`。
