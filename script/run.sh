#!/bin/bash

tar --strip-component=1 -xzf /home/services/web-ab-ci.tar.gz -C /home/services/web-ab/run/frontend/

exec pm2 start www.config.js --env production --no-daemon
