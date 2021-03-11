#!/bin/bash

# Create docker image containing qserv dashboard 

# @author  Fabrice Jammes

set -euxo pipefail

DIR=$(cd "$(dirname "$0")"; pwd -P)
. ./env.build.sh

docker image build --build-arg BASE_IMAGE="$BASE_IMAGE" --tag "$IMAGE" "$DIR"
docker push "$IMAGE"
