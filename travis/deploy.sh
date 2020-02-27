#!/bin/bash

eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 id_rsa
ssh-add id_rsa
git config --global push.default matching
git remote add deploy ssh://deploy@$IP:$PORT$DEPLOY_DIR
git push deploy master

ssh deploy@$IP -p $PORT <<EOF
  cd $DEPLOY_DIR
  echo deploy | sudo -S docker-compose build --force-rm --no-cache
  echo deploy | sudo -S docker-compose up -d
EOF