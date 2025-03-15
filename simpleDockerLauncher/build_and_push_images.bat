@echo off
echo Building and pushing two separate Docker images for AssetAtlas...
cd /d "%~dp0.."

echo Building local version of AssetAtlas
echo ===================================

docker-compose -f docker/docker-compose.yml build
docker tag assetatlas:latest berklith/assetatlas:latest

echo Pushing images to Docker Hub
echo ===================================

docker push berklith/assetatlas:latest

echo Build and push complete
echo ===================================

pause
