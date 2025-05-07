The following is documentation for future developers of this software, containing some information about the tools we have used and things we have learned.

# Major lessons

Don't be afraid to push (when you are at a natural stopping point (ideally the code is working), even in the middle of a larger change), especially when making changes to low-level parts of the project like Docker, Node.js, Vite, etc. You shouldn't need to make big changes to most of these tools, but just in case, make small changes, rebuild, and push. It's much easier than changing a bunch of things, trying to rebuild, failing, and then you have to debug everything you did and have no easy way to rollback some of it.

# Docker

A lot of problems we have had have been with Docker not building correctly. Sometimes this can be fixed by deleting existing images, containers, sometimes volumes as well, because of caching issues. i.e., if you make a change to a node package or typescript configuration or something, rebuild, it doesn't work, and then revert to the old version, it still may not work. At least that's how it's appeared sometimes.

# Node.js

# Github Actions

# Svelte

We are currently using Svelte 4. That's just how we started, and when we tried to switch to Svelte 5, the code broke. I don't know how easy it would be to update/fix at some point if you find some reason to use Svelte 5. The thing that broke had to do with reactive statements (I read online this should be backwards compatible but it was not) and it seems the solution may involve something called runes, which I don't know much about but is part of Svelte 5.

We are using base svelte instead of sveltekit. To make routing work, we are using a library called svelte-routing. This works fine for everything we are doing now, but sveltekit is more powerful. Converting the project to sveltekit would be possible, but it is a decent bit of work as you would have to restructure the entire project, so I wouldn't recommend it unless absolutely necessary.

One thing we ran into is that svelte only uses one instance of a component, so when trying to use the same component for multiple pages you will be using the same component and can't actually reinitialize it. The workaround to this was to use a svelte feature called keys. They are explained well in the svelte docs, but basically it destroys and reinitializes the contents of the key block whenever the value of the key changes. You will probably need to use keys whenever you need to use a component multiple times in the app, particularly if it is a displayed component, like a dialog box.
# Vite

# Tailwind

Tailwind is a library of small css classes that help with style brevity and consistency. We lightly use Tailwind throughout the project mostly as a supplementary resource so we don't have too many small classes in our main.css file. Examples of situations where we've been using Tailwind instead of custom styles includes adding a not-too-specific padding or margin to an element (e.g. class="mx-4 p-2"), quickly adding flex display to groups of elements like buttons (class="flex flex-col"), and other one-or-two line non-specific styles. A list of all available built-in Tailwind styles and thier effects can be found in the output.css file.

# CSS

Generally, all css styles should go into the main.css file. You should avoid doing inline styles (style="trait: value") and internal styles (<style> tag at the bottom of the file containing extra style declarations). These rules are put into place for consistency, to follow standards and maintain a clean codebase. If you happen to find an internal or inline style, you should migrate the style over to main.css to avoid potential confusion down the line as these styles may shadow others or overwrite certain style components.

The main.css file is grouped by how large the component is and within those size groupings related styles tend to be grouped together as well (i.e. all of the button styles are grouped together in the medium sized, single component section). Variables should be used for colors to maintain consistency, you can find examples of how to use the color variables within the main.css file and you can find the declarations of the variables in the customTheme.ts file.

# Github container registry

We currently have two ways for users to get/run out software, one of which is the github container registry. The related files/scripts are in .github/assetatlas. It includes two additional docker-compose files that are different from the other ones used by the python launcher. There is probably a way to merge these or use inheritance to simplfy them in some way. The readme in that directory contains info about how to run the github containers. Users still need to download docker and the compose files currently.

Build is handled automatically when pushing to production branch (with the idea being you develop on main branch, make sure stuff works, eventually push to prod as a release). To manually build and push the container image to GitHub Container Registry:

```bash
.\docker\build-and-push.bat AssetAtlasTracker AssetAtlas
```

Enter your GitHub Personal Access Token with package write permissions.
This should be run in projects top level (the provided command includes the pathing to the docker subdirectory).

# MongoDB

# Tailscale

We currently use tailscale for multi device/hosting support. Tailscale itself is a flawed solution to what we want to do. Ideally users could just self host from their own machine, but because we lack access to port forwarding at rose this was the best option we could find. Tailscale is a wire gaurd vpn protocol, where devices communicate via p2p whenever possible. But sometiems (I dont know what the conditions around this are), the devices communicate via tailscales servers. But the data is encrypted in that case. I'll also add that I read at some point that it was possible to self host an actual server, that anyone could access without having tailscale installed on their device, but that this would require getting HTTPS to work when hosting. It may have also cost some money or had some other limitations? Anyway the HTTPS problem is another thing, AssetAtlas right now only runs on HTTP for another reason I dont fully remember. You could try to fix this, it's probably possible we didnt spend too much time trying to switch it over as we got the tailscale hosting stuff out of the way pretty early in development and had bigger fish to fry once it was working at all.

# CSV Import/Export

All classes made for the CSV Import and Export feature are in the utility package. This feature has two main parts. First there are the parsers and formatters. These take csv data and create items and templates according to a format and vice versa. There are two types of csv files, ones formatted for items and ones formatted for templates. The specifications of these formats can be found at TODO. Support for new formats can be added through implementations of the Parser and Formatter interfaces. Supporting multiple formats at the same time would require changes to the ParserManager.

Beyond the parsers and formatters, this feature needs to import or read in data and export or write out data. Within the importing, JSZip is used to unzip folders which are recursively searched for csv files and images. While exporting, the built-in dowloadable attribute of HTML links is used, which takes the content given and downloads it to the dowaloads folder of the user.

A problem encountered while adding items is that our internal API calls made to wrap api calls directly to the database cannot be called within the domain level code.

# General design philosophy

We assume people will likely have widely varying needs and desires for a personal database solution. We thought that the best way to meet their needs would be making our system as open ended as possible, but still providing a basic structure that should apply or at least not get in the way for most use cases. This came in the form mainly of container nesting, custom fields, and item templates. With these tools we think most users can selectively keep track of only the things they care about while also having some useful QOL features that can enable more customized and detailed tracking without being too cumbersome to set up and re-use.

# Known issues
Mobile UI is currently very messy as we have been mostly focusing on making it work on computers first.

We have a search bar in the topbar, but searching only works on the home page. We want/wanted to make a little popup box thing with the top 5 matches or so show up on any page whenever the search bar gets typed in, but we didn't get around to it.

Passwords are not really secure as is, due to us using HTTP instead of HTTPS. They are hashed locally with SHA256 before getting sent to backend and hashed again. This means a man in the middle attack at least would not leak a users plaintext password, protecting them if they are using a re-used password for AssetAtlas.

# Possible future directions

Multiple templates per item. Would probably be a hard fork.
