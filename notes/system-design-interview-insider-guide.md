# System Design Interview – An insider's guide


## Scaling to a million users

Scaling to a million users
single web server
web server + database
add multiple web servers + load balancer
add multiple databases in master-slave configuration
add cache
add a CDN
make web servers stateless + add shared storage
add multiple datacenters
add a message queue + workers
shard the database


CDN
What dictates how long a asset is cached for?
- TTL (time to live)


database::cache as web-server::cdn


A stateful server and stateless server has some key differences. A stateful server remembers
client data (state) from one request to the next. A stateless server keeps no state information.


There's some state that a server needs to maintain from one request to the next e.g. a user's session. If this is kept on the server itself, then each user request needs to be routed to the same server. Instead, if you move the state to some separate store, you can distribute the requests across multiple servers.

This store usually doesn't have the same durability requirements as the main data store, so it can be implemented as an in-memory datastore or no-sql database.

In a mutli-datacenter setup, which components of the architecture *aren't* replicated across datacenters?
- client
- DNS
- CDN
- load balancer


Message queues allow you to decouple components. For example, you might have a component that sends out a welcome email after a user signs up. This component can simply add a message to a queue without waiting for the email service to complete processing. The email service can pick up the message from the queue at its leisure.

What are some common problems with database sharding?
- joins
- celebrity problem
- resharding


L1 and L2 are hardware caches used by the CPU which reduce the average cost to access data by being physically closer to the CPU.
