# Events

This directory contains event handlers for Slash-Create events. Files in this folder will automatically 
be registered to listen to the Slash-Create event specified by `name`.

Slash create events are mostly relevant in order to distinguish slash command interactions from other 
interactions. Slash-Create handles the discord INTERACTION_CREATE event and emits its own events to make the
different types of interactions available.

More info here:
[/create documentation](https://slash-create.js.org/).

Event handlers are structured as follows:
```typescript
export default class implements DiscordEvent {
    /*
     * Name of the event to handle.
     */
    name = 'componentInteraction';

    /*
     * Optional field. Indicates if this is a one time listener. If true, event
     * will be registered with `client.once` instead of `client.on`
     */
    once = true;

    /* 
     * Function that is called when event is emitted, Different events pass in a 
     * varying number of arguments. See discord.js documentation for arguments 
     * returned by emitted events. Client can be omitted as a function parameter 
     * if it is not used. 
     */
    async execute(...args) { 
        // Code to handle event
    };
}
```