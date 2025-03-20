#!/bin/bash
set -e

# Navigate to the project root directory
cd "$(dirname "$0")/.."

# Configuration
GITHUB_ORG=${1:-}
REPOSITORY_NAME=${2:-assetatlas}
GITHUB_TOKEN=${GITHUB_TOKEN:-}
VERSION=${VERSION:-latest}

# Check if first parameter is provided
if [ -z "$GITHUB_ORG" ]; then
  echo "ERROR: GitHub organization or username not provided"
  echo "Usage: $0 <github_org_or_username> <repository_name>"
  exit 1
fi

# Convert org/username and repository name to lowercase (GHCR requires lowercase)
GITHUB_ORG=$(echo "$GITHUB_ORG" | tr '[:upper:]' '[:lower:]')
REPOSITORY_NAME=$(echo "$REPOSITORY_NAME" | tr '[:upper:]' '[:lower:]')

# Authentication
if [ -z "$GITHUB_TOKEN" ]; then
  echo "No GITHUB_TOKEN environment variable found."
  
  echo "  1. Please enter your GitHub Personal Access Token with package write perms."
  echo "  2. Also make sure docker is running."
  echo -n "Github PAT: "
  read GITHUB_TOKEN
  
  echo -n "Enter your GitHub username (not the organization name): "
  read GITHUB_USERNAME
  
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
  if [ $? -ne 0 ]; then
    echo "Login failed. Please try again."
    exit 1
  fi
fi

# Set image name, for org repo, format is ghcr.io/org-name/repo-name
STANDARD_IMAGE="ghcr.io/$GITHUB_ORG/$REPOSITORY_NAME:$VERSION"

echo "Building standard image: $STANDARD_IMAGE"
docker build -t "$STANDARD_IMAGE" -f docker/Dockerfile-ghcr .

echo "Pushing standard image to GHCR..."
docker push "$STANDARD_IMAGE"

echo "Image successfully built and pushed to GHCR!"
echo "Image: $STANDARD_IMAGE"
