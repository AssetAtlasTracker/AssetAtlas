# Tech Stack Details

This document details major components of this project's tech stack. This information may be incomplete or somewhat innaccurate. Please update this document accordingly. For more information about how these components connect and to get a high-evel summary of their roles, see the following image: https://imgur.com/a/ll84JCy

---

## [Docker](https://www.docker.com/)

Docker "containerizes" an environment, then allows that container to be shared and ran on different devices. Essentially, imagine your project and all its dependencies got packaged into a nice box that other people could copy over to their devices. They wouldn't have to worry about version mismatch issues at all, since the container already has the correct version! Not everything is containerized, see the diagram linked above for details.

---

## [Node.js](https://nodejs.org/en)
Node.js allows developers to run JavaScript outside of your browser. This mostly means making command line tools or server-side scripts.

---

## [GitHub Actions](https://github.com/features/actions)

GitHub Actions is used for a number of different things related to workflow automation. One of the more notable uses in this repository is to run the linter and tests on a PR before it gets merged, essentially guaranteeing that only working code is pushed to main.

---

## [Svelte](https://svelte.dev/docs/svelte/overview)

Svelte is a framework for building interfaces on the web. It allows developers to define reusable components that can encapsulate specific behaviors like tooltips, sliders, or other parts of an interface.

---

## [Vite](https://vite.dev/)

Vite is a frontend build tool that provides a number of useful features. Essentially it bundles and optimizes frontend assets like HTML, CSS, and JavaScript.

Supposedly it also provides Hot Module Replacement, which allows you to make edits to frontend components and immediately see those changes, though I think the docker containerization messes with this process. Definitely worth looking into.

---

## [Tailwind](https://tailwindcss.com/)

Tailwind is a CSS framework with the goal of allowing you to style elements without ever leaving HTML. Rather than needing to go define classes and properties in a CSS file, Tailwind provides a number of helpful pre-made classes that you can simply attach to any HTML component.

---

## [MongoDB](https://www.mongodb.com/)

Mongo is our database system. It is a NoSQL database, meaning you won't need to be writing stored procedures or anything like that. Instead, Mongo basically just stores a bunch of entries as JSON files. 

MongoDB was chosen since its more flexible structure (things can be stored as mroe than just a table of values) made the implementation of the tree view much simpler. However, it is much harder to perform joins (combining information from multiple tables) with MongoDB, and swapping to another database like Postgres or SQLite is being considered.

---

## [Tailscale](https://tailscale.com/)

If you've ever tried to host a video game server for your friends you may be familiar with port-forwarding. Port-forwarding is sort of like leaving a door open for people to come in through. However, Rose doesn't let us students do any port-forwarding on our laptops (probably for security reasons?), so Tailscale is our workaround.

Tailscale is a VPN, and I'm not smart enough to really know how that works. But what it's doing for our project is bypassing that port-forwarding process and letting our devices connect without it. So your laptop can start up the project on port 3000, then your phone can connect to your laptop through the VPN by accessing port 3000 on your laptop's IP. Without Tailscale, attempting to connect to the IP and port won't work since your phone won't actually be able to "see" the port.