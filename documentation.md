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
# Vite

# Tailwind

# Github container registry

# MongoDB

# Tailscale

We currently use tailscale for multi device/hosting support. Tailscale itself is a flawed solution to what we want to do. Ideally users could just self host from their own machine, but because we lack access to port forwarding at rose this was the best option we could find. Tailscale is a wire gaurd vpn protocol, where devices communicate via p2p whenever possible. But sometiems (I dont know what the conditions around this are), the devices communicate via tailscales servers. But the data is encrypted in that case. I'll also add that I read at some point that it was possible to self host an actual server, that anyone could access without having tailscale installed on their device, but that this would require getting HTTPS to work when hosting. It may have also cost some money or had some other limitations? Anyway the HTTPS problem is another thing, AssetAtlas right now only runs on HTTP for another reason I dont fully remember. You could try to fix this, it's probably possible we didnt spend too much time trying to switch it over as we got the tailscale hosting stuff out of the way pretty early in development and had bigger fish to fry once it was working at all.

# General design philosophy

We assume people will likely have widely varying needs and desires for a personal database solution. We thought that the best way to meet their needs would be making our system as open ended as possible, but still providing a basic structure that should apply or at least not get in the way for most use cases. This came in the form mainly of container nesting, custom fields, and item templates. With these tools we think most users can selectively keep track of only the things they care about while also having some useful QOL features that can enable more customized and detailed tracking without being too cumbersome to set up and re-use.

# Known issues

# Possible future directions
