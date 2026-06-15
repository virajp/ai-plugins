# Frontend Screen Template

One programmable screen for the mobile app. Save as
`docs/engineering/frontend/{entity}/{screen}.md`. Purely textual — no
wireframes. The Elements, States, and Interaction-flow tables are what make the
screen codeable.

> Replace `{state-management}` and other bracketed terms with the project's
> stack from the architecture registry. Auth-gated states link to
> `../../foundations/auth.md`.

```template
# Screen: {Name} (`{route or id}`)

**Purpose:** [one line — what this screen is for].

**Entry:** [how the user arrives here — routes, deep links, triggers]. **Exit:**
[where the user can go from here].

## Layout (regions, top → bottom)

> The wireframe substitute: ordered regions, each listing its elements. Square
> brackets mark conditionally shown elements.

- **AppBar:** [title, back action, [overflow menu]]
- **Body:** [e.g. scrollable list of items / form / map]
- **Footer:** [[primary action]]

## Elements & Actions

| Element | Type | Content / Source | Gesture | Result |
| ------- | ---- | ---------------- | ------- | ------ |
| [name] | [button / list item / field / toggle / map] | [static / endpoint / state field] | [tap / long-press / swipe / scroll] | [navigate / call API / mutate state / open dialog] |

## States

> Every state the screen can be in. Cover at minimum: loading, loaded, empty,
> error, and any permission/offline/submitting states the feature can hit.

| State | Trigger | What's shown | Available actions |
| ----- | ------- | ------------ | ----------------- |
| loading | [on enter / refetch] | [skeleton / spinner] | none |
| loaded | [data ok] | [populated UI] | all |
| empty | [zero results] | [empty state + CTA] | [CTA] |
| error | [request failed] | [error message + retry] | Retry |

## Forms

> Include only if the screen has inputs. One row per field.

| Field | Type | Required | Validation | Default | Error copy |
| ----- | ---- | -------- | ---------- | ------- | ---------- |
| [field] | [type] | [yes/no] | [validation] | [default] | [error copy] |

## Interaction Flows

> Numbered sequences for multi-step interactions (pull-to-refresh, infinite
> scroll, optimistic update, multi-step confirm).

1. [user action] → [system response] → [resulting state / navigation]

## State Bindings

[Which `{state-management}` controller/fields back this screen, and which
reactive fields drive which elements above. Link to the entity `index.md`
controller section rather than restating it.]
```

## Field Documentation

| Field                                                   | Convention | Description                                            |
| ------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `{Name}`                                                | variable   | Screen name, shown in the heading.                     |
| `{route or id}`                                         | variable   | The screen's route or identifier.                      |
| `{state-management}`                                    | variable   | The state-management library from the project `stack`. |
| `[name]` / `[type]` / `[field]`                         | prose      | Table row content.                                     |
| `[Purpose]` / `[Entry]` / `[Exit]` / `[State Bindings]` | prose      | Section bodies as described below.                     |

## Section Specifications

| Section                | Required                         | Guidance                                                                                             |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Purpose / Entry / Exit | Always                           | One line each; how the user reaches and leaves the screen.                                           |
| Layout                 | Always                           | Ordered regions top→bottom; `[brackets]` mark conditionally shown elements.                          |
| Elements & Actions     | Always                           | Every interactive element gets a gesture and a result.                                               |
| States                 | Always                           | Every state with its trigger and available actions; auth-gated states link to `foundations/auth.md`. |
| Forms                  | If inputs exist                  | One row per field; note validation.                                                                  |
| Interaction Flows      | If multi-step interactions exist | Numbered: action → response → state.                                                                 |
| State Bindings         | Always                           | Link controller/fields to elements; reference the `index.md` controller section.                     |
