# PRD: Clustered Signals: Redis-backed shared state across cluster nodes

> Draft rewrite of [vaadin/platform#8703](https://github.com/vaadin/platform/issues/8703),
> following the format of [vaadin/platform#9001](https://github.com/vaadin/platform/issues/9001).
> Not filed yet — the issue is overwritten with this content once reviewed.

**Tier:** Enterprise
**License:** Proprietary

## Description

Shared signals that stay in sync across nodes in a cluster, so collaborative UI state works
regardless of which node a user is connected to. The initial implementation is backed by
**Redis**, behind an event-log SPI that other backends can implement later.

## Motivation

#### Background

Flow has signals for reactive UI state. Shared signals
(`SharedValueSignal`, `SharedNumberSignal`, `SharedListSignal`, `SharedMapSignal`) already
share state between users — but only between users connected to the *same* node. The
machinery for going further is in place: `AbstractSharedSignal` is built on
`AsynchronousSignalTree`, which submits `SignalCommand`s to an event log and waits for
external confirmation before completing them. Today the only implementation of that
abstraction is `LocalAsynchronousSignalTree`, which confirms commands on a local executor.

The gap is deliberate and visible: `SignalTree.writeObject` throws `NotSerializableException`
for any asynchronous tree, so that a developer who puts a shared signal in a session and
deploys to a cluster finds out at development time rather than in production.

#### Problem

Collaborative features — a shared form, a presence indicator, a live counter, a kanban board
several people move cards on — are exactly what signals are good at, and exactly what stops
working the moment the application is deployed on more than one node. Every Vaadin
application that runs in a cluster (which is every application that needs high availability
or rolling updates) is currently excluded from the feature.

The workaround is for the application to build its own synchronization: publish changes to a
message broker, subscribe on every node, and reconcile conflicting concurrent edits by hand.
Reconciliation is the hard part, and it is the part signals already solve within a single
node.

#### Solution

Multiple nodes hold signal instances that are connected to each other through a shared event
log. The application controls which instances are connected by passing a string identifier
when acquiring a signal from a `ClusteredSignalFactory`, configured as a bean:

```java
@Route
public class ClickCount extends VerticalLayout {
    public ClickCount(ClusteredSignalFactory factory) {
        SharedNumberSignal countSignal = factory.getNumber("clickCount");

        Button button = new Button();
        button.bindText(() -> "Click count: " + countSignal.get());
        button.addClickListener(click -> countSignal.incrementBy(1));

        add(button);
    }
}
```

Instances sharing an identifier stay in sync; instances with different identifiers share
nothing and are fully independent.

##### The event log

Each identifier maps to its own event log. Entries carry the `SignalCommand` values that
`AbstractSharedSignal` already produces — a sealed interface that is already annotated for
polymorphic Jackson serialization, so commands travel over the wire without a new format.

The log must have a **stable total order**: once an entry has been delivered to a node, no
later entry may be ordered before it. That ordering is what makes conflict resolution
deterministic — every node replays the same commands in the same sequence and reaches the
same state, and a command whose condition no longer holds is rejected identically everywhere.
Locally submitted commands are applied optimistically for latency compensation and reconciled
against the confirmed order when they come back from the log.

A signal instance created for an identifier that already has a log must replay that log to
catch up. Replaying from the beginning gets more expensive as the log grows, so the log is
periodically compacted: a snapshot of the tree state is stored alongside the position it
corresponds to, and a new instance loads the latest snapshot and replays only what came after
it. `SignalCommand.SnapshotCommand` already carries exactly this payload.

##### Why Redis first

The original issue left the backend open and listed candidates ranging from Kafka to
PostgreSQL to Hazelcast. Scoping the first implementation to one backend is what makes the
feature shippable, and Redis is the one to pick:

- **Vaadin clustering customers already run it.** Kubernetes Kit ships a Redis backend for
  session replication (`RedisConnector`, on Spring Data Redis). The signal backend can reuse
  the application's existing `RedisConnectionFactory` bean, so a cluster that already
  replicates sessions through Redis needs no new infrastructure to also share signals.
- **Redis Streams are a direct fit.** A stream gives an append-only log with
  monotonically increasing entry ids, `XADD` for submitting, blocking `XREAD` for
  subscribing, and `XTRIM` for compaction after a snapshot. A stream key lives on a single
  shard, so the total order the design needs is the order Redis already provides — and
  different signal identifiers land on different shards, which is the partitioning the design
  wants anyway.
- **It keeps the SPI honest.** Building against one real backend, with the abstraction sized
  to it, is a better foundation for a second backend than designing the abstraction for five
  hypothetical ones.

##### Serialization and session replication

Clustered deployments serialize sessions, so this has to be answered rather than deferred.
Signal instances are not shared between sessions: each session gets its own tree connected to
the same underlying log, and what is serialized is the identifier and the reference needed to
reacquire the signal, not the tree state or its listeners. On deserialization the signal
reconnects to the log and catches up from the latest snapshot. This keeps one session's
listeners out of another session's serialized state, and means a deserialized signal is
current rather than stale.

## Requirements

- [ ] A `ClusteredSignalFactory` that returns shared signals (`getValue`, `getNumber`,
      `getList`, `getMap`) for a string identifier, with instances for the same identifier in
      the same JVM resolving to the same signal.
- [ ] An event-log SPI that a backend implements to submit commands, subscribe to confirmed
      commands in a stable total order, and read and write snapshots.
- [ ] A Redis implementation of that SPI, built on Redis Streams and reusing the
      application's configured `RedisConnectionFactory`.
- [ ] Commands are applied optimistically on the submitting node and reconciled against the
      confirmed order, with conflicting commands rejected consistently on every node.
- [ ] A signal instance created for an existing identifier catches up to the current state
      before it is usable, loading the latest snapshot and replaying only later entries.
- [ ] Automatic snapshotting and log compaction, so log length does not grow without bound
      and catch-up cost stays proportional to recent activity rather than total history.
- [ ] Clustered signals survive session serialization and deserialization, and serializing a
      session does not pull in another session's signal listeners.
- [ ] Node loss is handled: a node leaving the cluster (cleanly or by crashing) does not
      stall other nodes, and state scoped to that node is cleared
      (`SignalCommand.ClearOwnerCommand`).
- [ ] Spring Boot auto-configuration with properties under `vaadin.signals.cluster.*`,
      enabled by adding the dependency and pointing it at Redis.
- [ ] Metrics for log lag, catch-up time, snapshot size and rejected-command rate, exposed
      through Micrometer so Observability Kit picks them up — a divergence or a node falling
      behind has to be visible in production without attaching a debugger.
- [ ] A reference collaborative example, deployed and running on a multi-node cluster, that
      demonstrates state converging across nodes and surviving the loss of one.
- [ ] Documentation covering the programming model, the Redis setup, and the operational
      characteristics (ordering, durability, compaction).
- [ ] License check
- [ ] Feature flag

## Nice-to-haves

- [ ] A non-Spring configuration path for standalone servlet deployments.

## Risks, limitations and breaking changes

#### Risks

- **Correctness is the main risk.** Race conditions that drop, duplicate or reorder commands
  produce state that silently diverges between nodes. This needs concurrency testing against
  a real multi-node setup, not only unit tests, including node restarts and network
  interruptions mid-stream.
- **Compaction is where correctness and performance meet.** Trimming a log while another node
  is replaying it, or snapshotting concurrently with writes, are the cases most likely to
  produce a node that is quietly behind.
- **Demand is unproven.** Comparable functionality was available as a Collaboration Kit
  preview without gaining traction. That is plausibly about Collaboration Kit's positioning
  rather than the underlying need, but it is a reason to keep the initial scope to one
  backend and validate with a pilot customer before broadening.

#### Limitations

- **Durability is bounded by Redis.** Redis replication is asynchronous by default, so a
  failover can lose entries that were already acknowledged, and a node that replayed them
  will be ahead of the new primary. This is acceptable for collaborative UI state and is not
  acceptable as a system of record — the documentation has to say so plainly, and the
  recommended Redis configuration for the feature has to be spelled out.
- Application-level access control stays the application's responsibility, exercised by
  choosing which users get which signal identifiers. Infrastructure-level access control is
  Redis's.
- Signal values must be JSON-serializable, as they already are for shared signals.

#### Breaking changes

- This is the first real use of the asynchronous shared-signal APIs, which may surface
  adjustments to `AsynchronousSignalTree` and to the internal listener-registration APIs
  (associating a listener with a session, for serialization).
- The `NotSerializableException` guard in `SignalTree.writeObject` is relaxed for clustered
  trees, which become serializable as a reconnectable reference.

## Out of scope

- **A second backend implementation.** Hazelcast, Kafka, PostgreSQL and others are follow-up
  work. The SPI is designed so they can be added without changing the programming model, but
  only Redis is built here — and the SPI is therefore validated against one backend, not
  proven backend-neutral until a second one lands.
- Persisting signal state as a system of record, or any query/history API over the event log.
- Cross-datacenter or geo-replicated clusters.
- Changes to the signal programming model itself — clustered signals are the existing shared
  signal types, connected differently.

## Metrics

Success criteria:

- An existing single-node collaborative view works unchanged on a multi-node cluster after
  adding the dependency and configuring Redis.
- State converges across nodes under sustained concurrent modification, with no divergence in
  a soak test that includes node restarts.
- Catch-up time for a new instance stays bounded as the log ages, rather than growing with
  total history.
- Validated with at least one pilot customer running an actual cluster.

## Pre-implementation checklist

- [ ] Estimated (estimate entered into Estimate custom field)
- [ ] Product Manager sign-off
- [ ] Engineering Manager sign-off

## Pre-release checklist

- [ ] Verified with pilot customer
- [ ] Documented (programming model, Redis setup, operational characteristics)
- [ ] UX/DX tests conducted and blockers addressed
- [ ] Approved for release by Product Manager

## Security review

Required. Signal state crosses the session boundary by design and transits a shared Redis
instance, so the review needs to cover what a signal identifier grants access to, isolation
between identifiers, and the transport and access-control configuration expected of the Redis
deployment.
