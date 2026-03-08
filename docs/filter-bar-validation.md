# FilterBar Validation

`FilterBar` 当前公开的字段校验入口只有两个：

- `.validate(fn)`
- `.zod(schemaOrFactory)`

它们都挂在 `filtro.string(...)`、`filtro.number(...)`、`filtro.date(...)`、`filtro.select(...)`、`filtro.multiSelect(...)`、`filtro.boolean(...)` 这些 builder 上。

这篇文档只讲“怎么用”：

- 什么时候用 `.validate(...)`
- 什么时候用 `.zod(...)`
- `number` / `date` 默认 editor 内部怎么处理 parse
- 自定义 `render` 时，parse 应该怎么自己接管

## 1. 最短用法

```tsx
import { filtro } from "filtro";

const fields = [
  filtro.string("keyword")
    .label("Keyword")
    .validate(({ value }) => {
      if (!value) return null;
      return value.length >= 3 ? null : "Use at least 3 characters";
    }),

  filtro.number("amount")
    .label("Amount")
    .validate(({ op, value }) => {
      if (value == null) return null;

      if (op === "between" || op === "notBetween") {
        return value[0] <= value[1]
          ? null
          : "Min must be less than or equal to max";
      }

      return value >= 0 ? null : "Amount must be greater than or equal to 0";
    }),
];
```

约定很简单：

- 返回 `null` / `undefined` 表示通过
- 返回字符串表示失败，这个字符串会作为错误文案显示

默认 `string` / `number` / `date` editor 会把错误显示在整条 filter item 的底部。

## 2. `.validate(fn)` 的用法

`.validate(...)` 适合写业务规则。

签名可以理解成：

```ts
validate(({ op, value }) => string | null | undefined)
```

参数含义：

- `op`: 当前字段正在使用的 operator
- `value`: 当前 operator 对应的已提交值，可能是 `null`

### `string` 示例

```tsx
filtro.string("title")
  .label("Title")
  .validate(({ value }) => {
    if (!value) return null;
    return value.trim().length >= 5 ? null : "Use at least 5 characters";
  });
```

### `number` 示例

```tsx
filtro.number("price")
  .label("Price")
  .validate(({ op, value }) => {
    if (value == null) return null;

    if (op === "between" || op === "notBetween") {
      return value[0] <= value[1] ? null : "Min must be less than max";
    }

    return value >= 0 ? null : "Price must be non-negative";
  });
```

### `date` 示例

```tsx
filtro.date("createdAt")
  .label("Created At")
  .validate(({ op, value }) => {
    if (value == null) return null;

    if (op === "between" || op === "notBetween") {
      return value[0] <= value[1] ? null : "Start date must be before end date";
    }

    if (op === "lastNDays" || op === "nextNDays") {
      return value > 0 ? null : "Days must be greater than 0";
    }

    return value >= "2024-01-01" ? null : "Date must be on or after 2024-01-01";
  });
```

### 多个 `.validate(...)`

可以连续调用多次。它们会按声明顺序执行，遇到第一条错误就停止。

```tsx
filtro.string("slug")
  .validate(({ value }) => {
    if (!value) return null;
    return value.length <= 20 ? null : "Use 20 characters or fewer";
  })
  .validate(({ value }) => {
    if (!value) return null;
    return /^[a-z0-9-]+$/.test(value) ? null : "Use lowercase letters, numbers, and dashes only";
  });
```

## 3. `.zod(...)` 的用法

如果你的业务已经在用 `zod`，通常直接用 `.zod(...)` 更省事。

```tsx
import { filtro } from "filtro";
import { z } from "zod";

const fields = [
  filtro.string("email")
    .label("Email")
    .zod(z.string().email("Please enter a valid email address")),
];
```

`filtro` 不会把 `zod` 作为硬依赖引进来。这里实际要求的是一个 `safeParse()` 兼容对象。

默认行为：

- `value === null` 时，`.zod(...)` 不报错
- `safeParse()` 成功时通过
- `safeParse()` 失败时，优先取第一条 issue message
- 如果没有可用 message，回退到 `"Invalid value"`

### 固定 operator 的 `zod`

如果字段只允许一种值形状，`.zod(...)` 最直接。

```tsx
filtro.number("amount")
  .operator("eq")
  .zod(z.number().min(0));
```

### 多 operator 的 `zod`

如果字段会在不同 operator 之间切换，应该传 schema factory：

```tsx
filtro.number("amount").zod(({ op }) => {
  if (op === "between" || op === "notBetween") {
    return z.tuple([
      z.number().min(0),
      z.number().min(0),
    ]);
  }

  return z.number().min(0);
});
```

`date` 字段也一样：

```tsx
filtro.date("createdAt").zod(({ op }) => {
  if (op === "between" || op === "notBetween") {
    return z.tuple([
      z.string().min(1),
      z.string().min(1),
    ]);
  }

  if (op === "lastNDays" || op === "nextNDays") {
    return z.number().int().min(1);
  }

  return z.string().min(1);
});
```

## 4. `parse` 现在怎么用

当前版本没有公开的 `.parse(...)` builder API。

也就是说，这样的写法现在并不存在：

```tsx
// 目前不支持
filtro.number("amount").parse(...)
```

现在的设计是：

- 对外暴露的只有 `.validate(...)` 和 `.zod(...)`
- `number` / `date` 默认 editor 内部自己处理 raw input 和 parse
- 最终写进 `FilterBarValue[]` 的仍然只有合法值或 `null`

所以“parse 的使用方式”目前分两类看：

1. 默认 editor
`FilterBar` 已经内置处理好了，你不需要额外写 parse。

2. 自定义 `render`
如果你接管了 value editor，那 raw input 和 parse 也要一起自己处理。

## 5. 默认 editor 内部的 parse 行为

这部分是库内部行为，但理解它有助于你正确选择 API。

### `string`

`string` 默认 editor 基本不需要格式转换：

- 输入框 raw string
- 直接作为 string value 提交
- 再跑 `.validate(...)` / `.zod(...)`

### `number`

`number` 默认 editor 会先处理 raw string，再决定要不要提交：

- `""` 提交为 `null`
- `"12"` 提交为 `12`
- `"-"`、`"1e-"` 这类非法中间态不会写进最终值
- 非法中间态会保留在输入框里，并显示错误

### `date`

`date` 默认 editor 同样会先 parse：

- `""` 提交为 `null`
- 合法日期字符串才会提交
- 非法日期输入不会写进最终值
- `between/notBetween` 会要求两端都完整
- `lastNDays/nextNDays` 会要求正整数

这也是为什么 `validate` 拿到的是“已提交值”，而不是原始输入字符串。

## 6. 自定义 `render` 时怎么处理 parse

如果你用了 `.render(...)`，库只会继续给你：

- `value`
- `onChange`
- `validate`

raw input、touched、parse 时机，仍然由你自己决定。

一个最小示例：

```tsx
import { useEffect, useState } from "react";

filtro.number("amount").render(({ value, onChange, validate }) => {
  const [draft, setDraft] = useState(
    typeof value === "number" ? String(value) : "",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(typeof value === "number" ? String(value) : "");
  }, [value]);

  function commit(nextDraft: string) {
    setDraft(nextDraft);

    if (!nextDraft) {
      const nextError = validate(null);
      setError(nextError);
      onChange(null);
      return;
    }

    const nextValue = Number(nextDraft);

    if (!Number.isFinite(nextValue)) {
      setError("Enter a valid number");
      return;
    }

    const nextError = validate(nextValue);
    setError(nextError);

    if (!nextError) {
      onChange(nextValue);
    }
  }

  return (
    <>
      <input
        value={draft}
        onChange={(event) => commit(event.currentTarget.value)}
      />
      {error ? <div>{error}</div> : null}
    </>
  );
});
```

这里要点只有两个：

- parse 失败时，不要调用 `onChange(illegalValue)`
- 想保留非法输入，就必须自己维护本地 draft

## 7. 什么时候用哪一种

- 只想加业务规则：用 `.validate(...)`
- 已经在业务里统一用 `zod`：用 `.zod(...)`
- 字段允许多个 operator，值形状会变：优先 `.validate(...)` 或 `.zod(({ op }) => ...)`
- 只用默认 editor：不需要关心 parse，库已经处理
- 用自定义 `render`：你要自己接管 parse 和 raw input

## 8. 当前边界

这套能力仍然服务于当前“扁平 FilterBar”实现，不代表已经进入未来规划里的复杂 builder 模型。

它目前不会改变这些事实：

- `logical` 层仍然保持纯类型定义
- `FilterBarValue[]` 仍然是最终对外状态
- 非法 raw input 不会进入 URL sync 或 saved views
- 当前没有公开的 `.parse(...)` builder API
