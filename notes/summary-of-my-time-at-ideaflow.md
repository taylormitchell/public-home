# Summary of my time at Ideaflow

I've worked at Ideaflow since August 2022, so just over 2 years.

It's been a rocky experience since the start.

Ideaflow is a seed stage startup that's pre-product market fit.

We're working on note-taking web apps primarily targetting consumers.

When I joined, the company was Jacob (founder), Bat (CTO), and Albert (engineer). The company had raised $10M in 2020.

A bunch of people had just quit the company, and the company was in a bit of turmoil.

They were working on a web app called thoughtstream which was kind of like apple notes.

The broad strokes of the app were already in place like the editor, search, and sync.

So I was mostly adding editor features and fixing bugs. 

Sometime in July 2023 Bat left the company. So it was just me and Albert.

We kept working, and eventually brought on more people. By the end of 2023 we were up to about 5 developers.

The app never really took off, and the product direction was pretty unfocused. We mostly just built whatever features Jacob wanted in the moment, and were constantly fixing bugs because every feature was "experimental" so done in a hacky way, but then left in and never cleaned up.

There were a few substantial features I worked on that stood out:
- Search improvments like sorting by relevance, quotes in search, etc
- Backlinks: an area at the bottom of each note that shows other notes that link to it)
- Condensed view: the app interface looks like a large text file, and condensed view would hide non-matching lines while searching, while still supporting editing)
- Help section
- Trash

At the end of 2023 we did a product hunt launch. It actually went pretty well. We were the highest voted product of the day. I think this has more to do with Jacob as a networker and marketing guy than the product. We got an uptick in users, but our growth rate was still pretty low a few months after the launch. We have a couple hundred users now.

In 2024, we started working on a new app called mew. Jacob had a broader vision of a graph-based knowledge management system, and mew was the first app to implement this.

The initial app you can imagine like notion, but every line is a node and what ties a node to another is a link. So you're kinda providing the user with a notion-like interface but you're actually manipulating a graph by using it. 

The product-hypothesis is that graphs are a better fit for representing knowledge bases, and the main reason they aren't used is because no one has figured out a good way to interact with them. That's what mew is trying to do.

This product became plagued with the same issues as thoughtstream. It wasn't clear who we were building for, and to what fidelity, so a lot of product and engineering decisions were made that ultimately didn't make sense. At this point we're back to just building what Jacob wants in the moment, and constantly fighting off bugs from hacky implementations.

A difference, at least initially, was that I played more of a product role. I was meeting frequently with Jacob to figure out what he wanted to build, why, and concretely specing out features. This was a slow and very painful process for me, but Jacob got a lot of value of it. He'd often say that I could "read his mind" and that I was "the only one who really understood what he wanted".

Some of the features I worked on as a developer:
- Node suggestions: when typing a new node, we'd show a list of similar nodes in a dropdown underneath, which updated on every keystroke.
- Sync: I had a big hand in defining and writing the sync system. The system isn't great to be honest, but I do understand sync systems pretty well at this point.
- Outline view: the app state is a graph, but the main view is a tree. I wrote the abstraction which maps tree-like operations to graph operations, and created the UI for it. Including things like ordering, pinning, and arrow navigation.
- Multiline notes
- Command bar  

As of right now mew is still just a prototype. We dog-food it internally but we haven't released to anyone outside the company yet.