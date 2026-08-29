# TypeScript — the async model

Single-threaded with an event loop. Almost every mistake in this topic is a
consequence of that one fact.

## `async`/`await` throughout

Prefer it to raw `.then()` chains: the control flow reads like the synchronous
version, `try`/`catch` works normally, and the stack traces are usable. Mixing
the two in one function is where ordering bugs hide.

## Never block the event loop

There is one thread serving every request. A synchronous CPU-bound loop — a
large parse, a crypto round, an image transform, a big `JSON.parse` — stops
**everything**, including health checks, for its whole duration. The service
does not look busy; it looks down.

The answers, in order of preference: don't do the work in the request path at
all (queue it — see the orchestration capability); do it in a worker thread; or,
if it must be inline, chunk it and yield between chunks.

Synchronous filesystem calls are the same mistake wearing an innocuous name.

## Floating promises are swallowed errors

An async call that is neither awaited nor explicitly handled will, when it
rejects, produce an unhandled rejection — far from the code that caused it, and
in a form that names the wrong place.

Await it, or handle it deliberately and say so. This is worth a lint rule
rather than vigilance, because it is invisible in review: the line looks
complete.

## Concurrency is explicit, and bounded

Independent work runs concurrently rather than in sequence — awaiting in a loop
serialises calls that had no reason to be ordered.

But **unbounded concurrency is its own failure**: mapping a thousand records to
a thousand simultaneous requests exhausts sockets, connection pools, or the
upstream's rate limit, and the first symptom is usually the datastore refusing
connections. See the connection-limit arithmetic in the `postgres` pack, which
is the same failure from the other end.

Bound it. A concurrency limit is a design decision that belongs near the code
doing the fan-out.

## Partial failure needs a decision

When several concurrent operations can fail independently, the code must state
whether one failure aborts the rest or all outcomes are collected. Both are
valid; the default — first rejection wins, siblings continue invisibly — is
rarely what anyone intended, and it leaves work running that nobody is waiting
for.

## Cancellation is cooperative and must be plumbed

Nothing is interrupted for you. A request that goes away leaves its downstream
work running unless a cancellation signal was passed down and is actually
checked. Plumb it through the layers that make outbound calls; long operations
that ignore it are work the product pays for and discards.

## Timeouts on every outbound call

An outbound call with no timeout inherits the platform default, which is
frequently "forever". One slow dependency then consumes the whole request
budget, and back-pressure propagates as an outage rather than as an error.
