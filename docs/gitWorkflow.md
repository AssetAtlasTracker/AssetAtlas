# Git Workflow

This project runs with a GitHub Actions continuous integration and continuous deployment systems and this document seeks to document the workings of said workflow. There are currently 2 main workflows used with integration and deployment, those workflows are documented in test.yml and docker-publish.yml

## Test

The most commonly used workflow is test.yml by far. It is run on every single commit and ensures that all tests still pass to prevent faulty code from being committed. The main events that occur in test are that it first checks out the repository before setting up Node and installing the necesary dependencies with `rm package-lock.json && npm install` then finally running the tests with `npm run test`. Additionally, it now also runs `npm run lint` for code coverage. It notably does not ensure that code has been auto formatted when committed as has been recently discovered.

## Build and Publish

This is the workflow triggered when a new build is being pushed to production. It takes a much longer time to run when compared to Test and has very different steps. This workflow also begins with 
checking out the repository following which it sets up QEMU (which enables cross-platform builds) with `uses: docker/setup-qemu-action@v2`. It then Logs in to GitHub’s container registry using `uses: docker/login-action@v2` and the 
automatically provided token. Following that it extracts the Docker metadata with `uses: docker/metadata-action@v4` and automatically generates image tags and labels. It then sets up Docker Buildx with `uses: docker/setup-buildx-action@v2`
before finally building and pushing the Docker image using `uses: docker/build-push-action@v4` and pushes it to GitHub.  Note that pull requests targeting production will run the build but not push the image
