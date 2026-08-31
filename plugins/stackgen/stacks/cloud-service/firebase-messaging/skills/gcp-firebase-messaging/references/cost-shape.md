# Cost shape — Firebase Cloud Messaging

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

**The send is not metered.** This is one of the few services on the provider
that does not bill per operation, which makes it the odd one out in this bundle
and makes the rest of this file the useful part: the cost of a notification is
everything around it.

## Where the money actually goes

**The fan-out read.** Sending to a hundred thousand users means resolving a
hundred thousand users' device tokens, which is a hundred thousand-ish datastore
reads on a store where reads are the dominant line. That is the bill, it lands
on the datastore's meter rather than this one, and it is the first thing to look
at when a notification campaign moves a bill.

The control is a data-model one, and it is the same denormalization instinct the
document store already asks for: keep the token collection small and directly
addressable from the recipient set, and do not resolve recipients by scanning.

**The compute that sends.** A large fan-out is a long-running job, so it is
either a background workload holding an instance for its duration, or a
scheduled batch. Either way the compute meter runs — and a job that sends one
message per request, sequentially, is paying for latency rather than work. Batch
the sends.

**The traffic it causes.** A notification whose whole purpose is to make clients
fetch produces a synchronized burst of API calls — a hundred thousand clients
opening the app within a minute of each other. That burst is compute, datastore
reads and egress, and it is the reason a broadcast is scheduled and staggered
rather than fired at once. Sending at 09:00 to everyone is a self-inflicted
load test with a bill attached.

**The token store that nobody prunes.** Dead tokens cost storage forever and
cost a read on every fan-out. Deleting on the unregistered response is a
correctness rule in the service doctrine and a cost control here.

## The guardrail

A notification send is one of the few paths where a product bug fans out into
every other meter at once, so it is worth a ceiling of its own: a rate limit on
the job, and a billing alert that would catch a loop before it finished. The
provider's day-one guardrails cover the general case; this is the specific one
worth adding.
