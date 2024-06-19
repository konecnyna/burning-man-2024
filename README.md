# How to

First make sure you follow prereqs and setup steps.

1. start server: `node src/server.server.js`
2. site map:
   - apps:
      - http://localhost:3000/fluid-sim/index.html
      - http://localhost:3000/neon-white-board/index.html
   - pipe:
      - http://localhost:3000/ 

## Prereqs

- python3
- node v22.0.0

## Setup


### Python opencv wrapper:

1. `cd src/cv`
2. `pip3 install -r requirements.txt`
3. `python3 src/cv/main.py --enable-mouse --show-cv`
4. `profit`

### Node

1. `cd src/server`
2. `npm install`

* Note: python3/pip3 is an alias for python 3.xx
