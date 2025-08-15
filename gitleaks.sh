#!/bin/bash

docker pull zricethezav/gitleaks:latest
docker run --rm -v "$(pwd):/path" zricethezav/gitleaks:latest detect -v --source=/path