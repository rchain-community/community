#!/bin/bash

private_key=`cat bootstrap.private-key`

cd `dirname $0`

rnode run -s \
   --validator-private-key $private_key \
   --dev-mode \
   -XX:MaxDirectMemorySize=100m -XX:MaxRAMPercentage=25 \
   > run-rnode.log 2>&1 &

tail -f run-rnode.log|sed -e '/Making a transition to Running state./q'
