# Identity shape — Firebase Cloud Messaging

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference. This file states what the send
path needs.

## Send as a service account, never a server key

The service has a legacy credential form — a long-lived server key — and it is
**exactly** the shape the provider's identity doctrine rules out: a permanent
credential with no expiry that ends up in an environment file, a CI variable, a
chat message. Anyone holding it can send to any of the product's users.

Send with a **service account** instead. On compute in this provider that means
the attached account and short-lived tokens from the metadata server, so nothing
is stored and there is no key to leak.

The grant is the narrow **send** permission on the project. It is not the
Firebase admin role, and it is not Editor — an identity that can send
notifications should not also be able to read the datastore or change project
configuration.

## Sending is a capability worth isolating

An identity that can send to any user can impersonate the product to every user
it has. That is a phishing primitive, not merely a nuisance: a notification
arrives with the product's name and icon on it.

So the send path is its **own workload** with its own service account — a
notification service or a job — rather than a capability every request-serving
service happens to hold. A request-serving service that needs to notify enqueues
work; it does not send.

## Who may cause a send

The narrower and more common question. Every path that triggers a notification
authorizes the *recipient set* as carefully as it would authorize a read: an
endpoint that lets a caller choose who is notified is an endpoint that lets a
caller message any user.

Topic sends deserve their own line here, because the authorization is inverted:
**the client subscribes**, so the server cannot control who receives a topic
message. Anything user-specific goes to tokens, and a topic name is treated as
public knowledge whether or not it looks guessable.

## Reviewing the send path

1. Does a **legacy server key** exist anywhere?
2. Does the **request-serving** workload hold the send permission, rather than a
   dedicated one?
3. Can any endpoint influence the **recipient set** from its request?
4. Is anything user-specific being sent to a **topic**?
