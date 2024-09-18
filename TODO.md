- classifier step
- let user add actions stored in localstorage
- export/import localstorage
- one terminal, but many "run a process"
- output is always added to context, user decides if it should be put in 
- chat boxes can be collapsed/expanded
- User can add action (groups), toggle:able in AI config view
- "Flavors", focused on different things, both as "forks" and as "groups" of available actions
- user can see all system prompt etc, super transparent what happens (because developer is the user)
- console log all network errors
- record everything that happens with rrweb. Let the AI "Ask" for what happened. Let the AI replay things the user did.
- Create 
- Add reasoning steps
- Let the AI have access to more things and context on the situation


IDEAS:
- accept status. + throw away context. Accepts are persisted after refresh.
- Goals and subgoals, where the user + human can edit them
- test suite?


TOOLS:
- surgically edit file action
- 

later:
- render html (artifacts) with callbacks to put things in context


QUESTIONS:
- how to update default system prompt. Probably don't make that editable by
user? Two step process to make it "Read only"?


FIXES:
- not rendering JS errors correctly
