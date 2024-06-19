#!/bin/bash

cd src/cv/
pip3 install -r requirements.txt --break-system-packages

cd ../server
npm install

cd ../../

echo "Donezo daddio!"
