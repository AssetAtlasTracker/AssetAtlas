# Purpose
`../svelteComponents` contains a collection of svelte files that serve as the reusable building blocks of the codebase. Of the many components in this directory, the following lists and gives a brief description of the most complex or most important

## CreateItem.svelte
This component creates a form-based dialog interface that lets a user create or duplicate an “item.” Said item is a basicItem from [basicItem.js](techStack.md) includes properties such as name, description, tags, parent/home relationships, a template, and optionally an image.

## EditItem.svelte
This component looks very similar to CreateItem.svelte on first glance and they are related. The key difference is that where CreateItem begins with empty fields and sends a create event while EditItem comes with fields auto-populated by the item being editted and sends an update event.

## Dialog.svelte
While far from complicated, this is perhaps the most used component as it creates a dialog which is the core of both CreateItem and EditItem.

## ItemDetails.svelte
This component fetches an item and all of its information including its "relations" such as parent items.

## Window.svelte
This component is rather self-explanatory, it's the window. While not flashy it is incredibly important and allows for dynamic resizing of the window and all default arrow key functionality.
