# Final shopify interview prep

## Next steps
- [ ] brainstorm some projects (with prompts from claude)
- [ ] go through notes/tickets from last 2 years for more ideas
- [ ] select 2-3 projects

## Project ideas

### Thoughtstream web app
A note-taking web app. Similar to apple notes. The main interface looks like a giant text file that you can search and edit. 

features:
  - search by relevance, quotes in search, etc
  - backlinks
    - ENT-1681 Toggle backlink section shortcut
  - maintaining expansion states
  - trash
  - maybe ios
  - condensed view
  - help section

### Mew
A graph-based knowledge management system. The main interface looks like notion, but every line is a node and what ties a node to another is a link. So you're kinda providing the user with a notion-like interface but you're actually manipulating a graph by using it. 

features:
  - sync
  - autocomplete
  - graph <> tree and/or outline view generally
     - pinned
     - ordering
     - arrow navigation
  - multiline notes
  - command bar  




## Write ups for each project

### Sync System in Mew

What problem were you trying to solve with the sync system?

The main purpose for the app we were building was to have a prototype where we could use it to test out the idea of a graph-based knowledge management system. The founder/product owner Jacob needed persistence so he could use it in real contexts, and need the app to be very fast for search and real-time suggestions. We also wanted the system to be easy to iterate on as developers.

So we decided that we'd use a local-first approach, where all the data was available locally, allowing for very fast search and suggestions. To support persistence we needed a sync system.

We wanted full control over the data model. It's a graph with lots of relations and indexing needs. We opted for a custom solution.

In the future, we may go with a different approach, but for prototyping, we were fine with something simple and easy to iterate on. If it's not super reliable or performant, it's not a big deal because we're just prototyping.

There are two main approaches we considered:

1. Similar approach to replicache. I'd studied this system in the past, so felt comfortable implementing it. You define all changes to your data as mutations, and implement a function on the client which can perform them and a separate one on the server which can apply them. As you make changes locally, you send them to the server and apply them to the server's data. When you pull, the server sends a diff b/w the last pull and the current state. The client rolls back to it's state after last pull, applies the patch, then applies any local changes the server hasn't seen yet.

2. Whenever an object is created, updated, or deleted, we generate an event that represents that change. These get sent to the server periodically. We also have a websocket connection so the server pushes events from all clients to all clients. The client applies events from different client to it's local state. This approach doesn't guarantee consistency, cause events may be lost or out of order. But it's simple and easy to implement. How to deal with the app getting out of sync? Well the user can always just refresh the page. Since we're just prototyping, and the data is small, it's not a big deal. But we also added a behaviour where if a client's pushed event is rejected by the server, the app just does a fresh pull of the full state.      

What was the solution you implemented?

We went with the second approach.

What were the key technical challenges or constraints you faced?

We initially built the system as a very early prototype that didn't have persistence at all. Then we needed to add sync on top of it. A challenge was adapting the store to generate the events. We were using mobx for reactivity, and just mutating the data directly. We ended up moving to an architecture that was more flux-like, where you dispatch actions which get applied to the state. Once we did that, we could easily generate events at the action level.

(TODO something else probably)

What were the main trade-offs you considered?

The main trade-off was between ease of initial implementation vs reliability/consistency. We had more confidence that (1) would be more reliable, since it considers how to rebase when local changes diverge. But it's more complex to implement. We decided to go with the second approach, cause it was easier to implement. In both cases, we were going to need to the store towards one that generates events/mutations, and so we figured that if we wanted to move to (1) later, we'd have done the heavy lifting already. 

How did it turn out and what did you learn?

I would've done things quite differently in hindsight. I think starting from the initial prototype w/o syncing and modifying it to use sync was a mistake. That prototype was created in a really quick and dirty way. The purpose of that initial prototype was just to get something on screen for the founder to use. It was a proof of concept of sorts - a check that the interface ideas were roughly right. Lots of corners were cut to make that happen fast, and so it was a bit of a mess. I think we wouldn've made faster progress if we'd thrown out the prototype and started from scratch. Or if we'd had the foresight to start with, we could've been less fast and loose when building the initial prototype.

I also think that going with option (2) was a mistake. We'd bought ourselves some time to build a sync system, and we should've capitalised on that more to make something reliable. The sync system has plagued us with inconsistencies and bugs for a long time. The founder is very feature focused right now though, so there's never time to really going in and address the issues. It's a big technical debt that's been slowing us down.

### Thoughtstream search

#### What problem were you trying to solve with the search improvements?

When I joined, the search would just take the query and look for notes which contained that text. 

Improvements we wanted:
- has to run locally
- needs to be fast
- need to ship something quick
- better matching
- sort by relevance
- less clutter in search results

#### What was the initial search functionality like and what specific improvements did you make?

ideas we landed on for improvements:
we have all the data in memory, so we can do fast search
- better matching
  - split query into words
  - remove punctuation and stop words 
  - stemming
- relevance score
  - exact match is highest
  - exact prefix match is next
  - number of matching words ups score
  - matches in the title are ranked higher than in body
- fast
  - we considered using a trie, but we found the performance was fine without it i.e. on 1000 notes (much more than the typical user), you could search on every key stroke. We needed to add a slight debounce though.
- less clutter in search results
  - the existing app would show the full note of every match. If you had really long notes, that meant it was hard to scan through the results.
  - the obvious thing to do would be a preview, but it was a hard contraint that the search results needed to be editable.
  - so we came up with the idea of a "condensed view". the editor could hide non-matching lines and just render an ellipses in the editor. This was non-editable. The lines the user was interested in would be visible and editable. They could also click the ellipses to expand them out.

#### What were the key technical challenges, especially around relevance scoring and performance?

The relevance scoring was pretty straightforward. We initially tried a fuzzy match library but the founder kept asking for more control over the scoring. So we just implemented it ourselves. We started with a simple scoring system and then iterated on it as we got feedback from the founder.

The performance was surprisingly good. In-memory search is fast. It wasn't quite fast enough to execute on every key stroke though. You'd notice a slight delay. So we'd wait until there was a slight pause in the users typing, and then execute the search. We found this didn't interrupt the typing experience and still felt responsive.

The condensed view was a bigger challenge. We had to change the editor schema a bunch to support the condensed lines. By default the whole editor is editable, so we need to add a bunch of logic to notice when the user was trying to do an operation on a condensed line a prevent it. We also wanted a very consistent experience b/w the main view and search results view. So we needed to update the whole main editor to support both. 

#### What were the main trade-offs you considered in your implementation?

We didn't do too much consideration of trade-offs. It was a pretty iterative approach. We had some ideas of how to do matching and relevance scoring, implemented, then iterated on it with the founder.

There's a bit of a complexity trade-off with making it fast. I think if we had done a trie, we could've updating the results on every key stroke without debouncing. That's more memory and more complexity though. Adding a debounce was way easier and good enough.

For the "less cluttered" requirement, there's another big trade-off in complexity. If we just did a preview, it would've been much easier to implement. We could've had a new view that wasn't tied to the existing editor. Users click it to see the note in an editable view. But this was a hard constraint for the founder, so we needed to go with the more complex solution.

### Mew tree view

TODO: you could say something about the different approaches for rendering. You could have each node component responsible for fetching it's children. There's no top-level tree structure, you just pass down the children and the next component fetches the next one. Has draw-backs though. 

#### What problem were you trying to solve with this feature? (What was the product need and technical challenge?)

We had the core data model figured out: a graph with nodes and labelled edges. But we wanted a way to explore and edit the graph that felt more like working with a document.

We landed on a outliner editor (think workflowy). On a given view, you'd focused in on a node, which is rendered like a title at the top. Then you have a bulleted list underneath, where each bullet represents an edge+node connected to the root node. From here, you can expand out any of the bullets to show *their* children. This is a tree structure. 

#### What were the key technical aspects of mapping graph operations to tree operations?

- It needed to be responsive. I also wanted the state to be a directly reflection of the graph. I didn't want to have to maintain a separate state for the tree. So we had a function which took a root graph node, and the set of paths that were expanded, and then output a tree structure. This was a computed value using mobx, so it would automatically update whenever the graph changed. So if a node was added, deleted, whatever, the tree would update.

- One thing that wasn't reactive was the filter bar. When you type into the filter bar at the top, we wanted the tree to filter down to only those nodes that matched the filter (including their ancestors). While in this filtered view, we still wanted to be able to edit nodes, add nodes, etc. But we _didn't_ want these to be subversive to the filter. E.g. you add a node and that node is blank, so wouldn't match the filter. We still want that node to be in view though. 

- Creating features like selection, re-ordering, multiline deletion, etc are much easier to implement when you have an abstraction where you can think in terms of trees. Like a structure where you have a node and say "who are your children?", "who is your parent?", "who are your siblings?", etc. In the graph, there's no "parent". Cause a node can be connected to many other nodes. It's only meaningful once you've selected a node, and done this recursive expanding out. So we added a tree abstraction which our features could express logic in terms of, and which would translate into graph operations. For example: you say "remove this node from it's parent" and that would delete the edge connecting it to the parent node. 

#### How did you handle things like ordering, pinning, and navigation?

Ordering was a little tricky. Initially the graph didn't contain any sense or ordering. Like you've got a node and it's connected to 3 other nodes via edges. There's no "first" or "last" edge. But when you render it in a tree, you _do_ want there to be an ordering. And you want that ordering to be consistent no matter where you see the node in the tree (it can even be rendered in 2 places in the tree). So we added a data structure associated with each node which contained the ordering of it's edges. We were careful to keep this up to date as the graph changed.

Pinning ended up piggy-backing on the ordering data structure. So we've got this data structure which maps edge ids to an index. _All_ edges. Now we want to have pinned edges, and we want those pinned edges to have their own unique ordering. So we add a second data structure which maps pinned edge ids to an index. This serves as both the store of positions and the definition of whether an edge is pinned or not. 

I discussed above that we used a mobx computed value to keep create the tree state. Mobx keeps this value cached, so we can traverse it without re-computing it. This made implementing arrow-key navigation pretty easy. You know where the selection is, and you can grab that node in the tree, and then walk up/down to find the next location to place the selection. The selection was added as state within the tree, and then our editors had effects which bind the dom selection to the tree selectoin state. 

#### What were the main technical challenges and trade-offs?

Making the tree a computed value has a performance trade-off. Every time you delete a single bullet from the outline, the entire tree gets re-computed. This tends to be quite fast, and doesn't actually result in a lot of dom operations, which is much more expensive. But it's still a trade-off.

Something which we still haven't addressed is handing trees that have a lot children. Right now we just render everything on the dom. But this is a huge hit on performance. Pagination isn't quite as clean in this set up, because it's not just a flat list of items to add pagination to. You could have many deeply nested sets of children, each of which are very long. You could add pagination to all of them, but it starts to clutter the ui. The other option is virtualization, but that's tricky on a tree too. 

#### How did it turn out and what did you learn?

- Given how users are using it, I wish we'd considered pagination or virtualization earlier.
- We added a bit too much abstraction in the tree. It's a bit of a pain to walk through the code and see what's happening.
- We didn't integrate the tree well into the graph store's undo/redo system. A lot of operations are done using many separate actions, and so it takes many undos to undo. (TODO: could say a lot more here)
- TODO probably other stuff


## Cheat sheet for deep dive interview

### Mew outliner view
Have canvas + workflowy ready. Maybe have mew ready?

#### Intro
- About mew. Graph-based knowledge management system. Prototype.
- Outliner as primary interface for exploring and editing the graph. 
- Business context: Early-stage prototype, internal team of ~5 devs using it daily
- Business impact: founder had uncertainty about whether this interface fits the product. Creating this outliner was a way to test that, while also building or own competence in building reactive interfaces on graphs.
- I collaborated closely with the founder to design the interface.
- Role: On mew: split between product and engineering. On the outliner view I was the only engineer.
- Main technical considerations:
  - responsive
  - don't want to maintain a separate tree structure 
  - want features for this interface written in terms of tree operations
  - features should have access to the tree state

#### Key technical aspects
- Tree as a computed value vs maintaining a separate tree structure vs delegating to sub-components
- Indexing relationships by node id for fast generation
- Expansion state
- Filtering the tree
- Arrow key navigation
- Ordering and pinning

#### Challenges
- expansion states
  - you can have same node/relation at multiple locations in the tree so can't use it as unique identifier
  - maintaining expansion state across views
- order consistency. you can't guarantee unique indices even with fractional index
- the magic of mobx hit performance hard a few times. it's easy to just implement things and it "just works" but sometimes you do something that kills performance and it's not obvious why. But usually it's just a memoization thing e.g. the relation combobox doesn't need to pull all options on every render.

#### Lessons learned
- Too much abstraction in the tree.
- Didn't integrate well with the graph store's undo/redo system.
- Tree state isn't quite as nice as I'd hoped. Features only have access to a snapshot of the tree. They can't manipulate it directly. So if you had some complicated feature that was easier to express in an imperative way, where you manipulate the tree, then manipulate the new state, etc, you can't really do that.
- We didn't consider pagination or virtualization early enough.

### Thoughtstream search

#### Intro
- About thoughtstream. Note-taking web app.
- Role: Implementation
- Initial state: query included in note
- Collaborated closely with founder to design the interface.
- After project:
  - fast
  - better matching
  - sort by relevance
  - less clutter in search results
  - search syntax
- Impact: faster, more useful. users often point to the search as a key feature we do well. highest voted product on product hunt.


#### Key technical aspects
- Making it fast. In-memory search. No need for trie. Use debounce. ~100ms delay on 1000 notes.
- Relevance scoring. Started with fuzzy. Moved to custom.
  - exact match is highest
  - exact prefix match is next
  - number of matching words ups score
  - matches in the title are ranked higher than in body
  - User feedback: Founder drove requirements for match scoring
- Collapsed view
- search syntax

#### Challenges
- Collapsed view. It was the first feature added to the editor which introduced a non-editable component. 
  - At some point I remember we hadn't updated our serializer to handle the new editor component, so we were losing data that was collapsed.
  - Getting the ui/ux nice was tough. I'm not sure we did a great job of it. Sure, you can hide stuff with the ellipses, but you click and can still be overwhelmed with text. There wasn't an easy way to get back into the state you wanted without scrolling up/down to find the button you needed.
- 
- TODO: more

#### Lessons learned
- I wish we'd re-worked the editor more once we had a proof-of-concept with collapsed view shoe-horned into it.



## Plan

Thu, Fri, Sat - Technical deep dive

- Select 2-3 frontend projects. Discuss with claude to select.
- For each project:
  - why it was important
  - role/responsibility
  - design choices, tradeoffs, and key decisions
  - technical details  
  - challenges
  - lessons learned
- Practice doing the interview with claude

Sun, Mon - System design interview

Do practice problems and have claude mock as the interviewer with a bunch of questions. 
https://www.greatfrontend.com/questions/system-design

It may be worth briefly reading through the topics which claude suggests. Seemed like a better summary than the resources I found
https://www.frontendinterviewhandbook.com/front-end-system-design
https://www.youtube.com/watch?v=QemIfzcEeMM&ab_channel=ChiragGoel


