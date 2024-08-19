window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();
window.addEventListener("load", app);

function app() {
  var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"),
    // canvas dimensions
    w = 1136,
    h = 640,
    // scale, keep at 2 for best retina results
    s = 3;
  // set canvas dimensions with scale
  canvas.width = w * s;
  canvas.height = h * s;
  canvas.style.width = "auto";
  canvas.style.height = "100%";
  ctx.scale(s, s);

  var mouseX = 0;
  var mouseY = 0;

  let move = 0;
  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (move++ > 30) {
      // Create a new ribbon at the mouse position
      let newRibbon = new ribbon(mouseX, mouseY);
      rbns.push(newRibbon);
      move = 0;
    }
    
  });

  var rand = function (min, max) {
    return Math.floor(Math.random() * ((max + 1) - min)) + min;
  },
    ribbon = function (x, y) {
      let colors = ["#f0f", "#f80", "#f81", "#ff0", "#8c4", "#0ff", "#00f"];
      this.r = rand(1, 2);
      this.rLimit = this.r + rand(6, 12);
      this.rInc = this.rLimit / 100;
      this.dir = rand(0, 1);
      // -1 = left/up, 0 = right/down
      if (this.dir === 0) {
        --this.dir;
      }
      this.dirAdjChance = 0.01;
      this.dirAdjLimit = 2;
      this.dirTimesAdj = 0;
      this.axis = rand(0, 1); // 0 = x, 1 = y
      this.x = x;
      this.y = y;
      this.speed = 2;
      this.amp = rand(1, 2);
      this.freq = rand(100, 400);
      this.freqAdjChance = 0.05;
      this.freqMaxAdj = 10;
      this.color = colors[rand(0, colors.length - 1)];
      this.opDec = 0.002;
      this.opDelayInc = 0.001;
      this.lightMid = rand(0, 1);
      this.lightColor = "#fff";
      let colorIndex = colors.indexOf(this.color);
      if (colorIndex == 1 || colorIndex == 4) {
        this.lightColor = "#ff0";
      }
      this.exitedX = false;
      this.exitedY = false;
      this.members = [];
    },
    rbns = [],
    drawScreen = function () {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      for (let i in rbns) {
        let fill;
        // ribbon coloring
        if (rbns[i].lightMid) {
          fill = ctx.createRadialGradient(
            rbns[i].x, rbns[i].y, rbns[i].r / 2,
            rbns[i].x, rbns[i].y, rbns[i].r * 1
          );
          fill.addColorStop(0, rbns[i].lightColor);
          fill.addColorStop(1, rbns[i].color);
        } else {
          fill = rbns[i].color;
        }
        // render ribbon head
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0;
        ctx.beginPath();
        ctx.arc(rbns[i].x, rbns[i].y, rbns[i].r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        for (let m in rbns[i].members) {
          // render members
          let mmbr = rbns[i].members;

          if (rbns[i].lightMid) {
            fill = ctx.createRadialGradient(
              mmbr[m].x, mmbr[m].y, mmbr[m].r / 2,
              mmbr[m].x, mmbr[m].y, mmbr[m].r
            );
            fill.addColorStop(0, rbns[i].lightColor);
            fill.addColorStop(1, rbns[i].color);
            ctx.fillStyle = fill;
          }
          ctx.globalAlpha = mmbr[m].op > 1 ? 1 : mmbr[m].op;
          ctx.beginPath();
          ctx.arc(mmbr[m].x, mmbr[m].y, mmbr[m].r, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();

          // update chain
          if (mmbr[m].r < rbns[i].rLimit) {
            mmbr[m].r += rbns[i].rInc;
          }
          if (rbns[i].exitedX || rbns[i].exitedY) {
            mmbr[m].op -= rbns[i].opDec;
            if (mmbr[m].op < 0) {
              rbns[i].members.pop();
            }
          }
        }
        if (!rbns[i].exitedX && !rbns[i].exitedY) {
          // generate new member with current position
          rbns[i].members.unshift(
            {
              x: rbns[i].x,
              y: rbns[i].y,
              r: rbns[i].r,
              op: rbns[i].members.length === 0 ? 0.1 : rbns[i].members[0].op + rbns[i].opDelayInc
            }
          );
          // update position
          if (rbns[i].axis == 1) {
            rbns[i].x += rbns[i].amp * Math.cos(Math.PI * rbns[i].y * rbns[i].freq ** -1)
            rbns[i].y += rbns[i].speed * rbns[i].dir;
          } else {
            rbns[i].x += rbns[i].speed * rbns[i].dir;
            rbns[i].y += rbns[i].amp * Math.cos(Math.PI * rbns[i].x * rbns[i].freq ** -1);
          }
          // randomly alter path
          if (Math.random() < rbns[i].dirAdjChance && rbns[i].dirTimesAdj < rbns[i].dirAdjLimit) {
            rbns[i].dir = -rbns[i].dir
            ++rbns[i].dirTimesAdj;
          }
          if (Math.random() < rbns[i].freqAdjChance) {
            rbns[i].freq = rand(rbns[i].freq - rbns[i].freqMaxAdj, rbns[i].freq + rbns[i].freqMaxAdj);
          }
        }
        // redefine ribbon on exit and after all members are dead
        if (rbns[i].x > w + rbns[i].rLimit || rbns[i].x < -rbns[i].rLimit) {
          rbns[i].exitedX = true;
        }
        if (rbns[i].y > h + rbns[i].rLimit || rbns[i].y < -rbns[i].rLimit) {
          rbns[i].exitedY = true;
        }
        if ((rbns[i].exitedX || rbns[i].exitedY) && rbns[i].members.length === 0) {
          rbns[i] = new ribbon(mouseX, mouseY);
        }
      }
    },
    run = function () {
      drawScreen();
      requestAnimFrame(run);
    };
  run();
}