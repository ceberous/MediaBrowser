#!/bin/bash
sudo ssh -fN -R *:10006:localhost:4000 nomachine@45.76.16.174 -o "ServerAliveInterval 60" -i /home/haley/.ssh/vnet

