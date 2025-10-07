# Purpose
The sveltePages directory contains a collection of svelte files that make up the actual pages that Users will be able to visit and see. The following document gives an overview of each file and what they reflect on the customer side.

## Home.svelte
This svelte file reflects the Home page that is immediately opened when a user opens the App. This page displays the user's items or a No Items Found message in the case that the user has no items. Upon first opening since the user is not logged in, it will simply display that no items were found.

## Users.svelte
Currently non-functional. (Likely to be removed)

## Utility.svelte
This svelte file reflects the Import/Export page with the same functionality of AssetAtlas. It is currently built to handle import and export of both CSV files and zip files.

## View.svelte
This svelte file reflects the page for when a user brings up the larger item tree view. It displays things like details of items in the item tree and has item search and deletion built in. Upon item deletion, return to the Home page.

## ViewTemplates.svelte
This svelte file reflects the page for when a user brings up the existing templates. Much like the View.svelte page, it displays the details of the templates and has template search and deletion capabilities.
