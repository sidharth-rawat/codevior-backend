#!/bin/bash
# This script will enter the Docker container and tail the supervisord logs
docker exec -it codevior-node-app /bin/bash -c "cd /var/log/supervisord && tail -f supervisord.out.log"