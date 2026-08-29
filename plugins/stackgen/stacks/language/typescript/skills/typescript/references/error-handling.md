# TypeScript — error semantics

The language gives you exceptions and nothing else, so the discipline has to
come from the design. This is the topic where "it compiles" and "it behaves"
diverge most.

## The shape: values at the boundary, exceptions in the middle

**Inside a module, throw.** Exceptions are the language's mechanism, they carry
a stack, and threading a result type through every internal call buys little
when the caller is three lines away.

**At a boundary, return a value.** A service method that can fail in a way the
caller must handle differently should say so in its type, because a thrown error
is invisible to the type system — TypeScript has no checked exceptions, so
nothing tells a caller that a call can fail, and nothing breaks when a new
failure mode is added.

The boundary is wherever the failure becomes someone else's decision: the
services layer, a job handler, a route.

## One mapping home

**There is exactly one place that turns an internal failure into the product's
coded response.** Not scattered `try`/`catch` blocks each inventing their own
status and message — that is how one product ends up returning four shapes for
the same class of failure, and how a stack trace reaches a user.

That home is usually the error middleware or the handler wrapper. Everything
below it throws or returns domain failures; it decides what the outside world
sees, logs the detail, and returns the coded response the API contract states.

## `catch` is `unknown`, and that is correct

Under `strict`, a caught value is `unknown` because JavaScript permits throwing
anything. Narrow it before use. The tempting `catch (e: any)` re-introduces
exactly the class of bug the compiler just prevented — reading `e.message` off a
thrown string produces `undefined` and a log line that says nothing.

## Never swallow

An empty `catch`, or one that logs and continues, converts a failure into
corrupted state that surfaces somewhere unrelated. If a failure is genuinely
tolerable, the code says so explicitly — a comment stating why, and a counter or
log so the tolerated failure is still visible.

The same applies to a floating promise: an un-awaited async call whose rejection
nobody handles is a swallowed error with a delay. See
[the async model](async-model.md).

## Errors carry context, not prose

Attach the identifiers needed to investigate — the entity id, the operation, the
upstream status. Do not build a human sentence deep in the stack: the message
that reaches a user is the mapping home's decision, and a sentence assembled
early is one that cannot be localized, changed, or safely shown.

## Custom error types where the caller branches

Define a type when a caller must distinguish — not for every failure. The test
is whether anything ever branches on it. A hierarchy nobody discriminates is
ceremony; a single untyped `Error` where three outcomes need different handling
forces string matching, which breaks the first time a message is reworded.
