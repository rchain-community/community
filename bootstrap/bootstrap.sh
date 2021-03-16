#!/bin/bash

ALREADY=`ps a |grep -v grep |grep rnode|sed 's/[ \t][ \t]*/ /g'|cut -d' ' -f 2`

[ -n "$ALREADY" ] && echo "
Cannot bootstrap: rnode is currently running
Use 'kill $ALREADY' to fix.
" && while read -p "Execute 'kill $ALREADY' [y]? " response;do
	if [ "$response" == "y" ] || [ -z "$response" ];then
      set -x
		kill $ALREADY
      set +x
		break
	else
		echo "Aborting bootstrap"
		exit 1
	fi
done

[ -d ~/.rnode ] && echo "
Cannot bootstrap: $HOME/.rnode exists
Use 'rm -rf $HOME/.rnode' to fix.
" && while read -p "Execute 'rm -rf $HOME/.rnode' [y]? " response;do
	if [ "$response" == "y" ] || [ -z "$response" ];then
      set -x
		rm -rf $HOME/.rnode
      set +x
		break
	else
		echo "Aborting bootstrap"
		exit 1
	fi
done

[ -n "`./list-checkpoints.sh |grep 'bootstrap'`>/dev/null" ] && echo "
bootstrap checkpoint exists.
" && while read -p "Use checkpoint instead of re-running bootstrap [y]? " response;do
	if [ "$response" == "y" ] || [ -z "$response" ];then
		./restore-checkpoint.sh bootstrap
		exit 0
	else
		echo "Rerunning bootstrap"
		break
	fi
done

set -x

cd `dirname $0`

private_key=`cat bootstrap.private-key`

mkdir -p ~/.rnode || exit 3
tar cf - genesis|(cd ~/.rnode; tar xvf -) || exit 3

rnode run -s \
	--validator-private-key $private_key \
	--dev-mode \
	-XX:MaxDirectMemorySize=100m -XX:MaxRAMPercentage=25 \
	> bootstrap.log 2>&1 &

# The previous command doesn't produce output -- but this one makes up for that
tail -f bootstrap.log|sed -e '/Making a transition to Running state./q'

echo "Creating bootstrap checkpoint"
./create-checkpoint.sh bootstrap
