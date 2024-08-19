window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    // Make the canvas occupy the full page
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Create particles
    var particles = [];
    for (var i = 0; i < 25; i++) {
        particles.push(new particle());
    }

    function particle() {
        // Location on the canvas
        this.location = { x: Math.random() * W, y: Math.random() * H };
        // Radius - let's make this 0
        this.radius = 0;
        // Speed
        this.speed = 3;
        // Steering angle in degrees range = 0 to 360
        this.angle = Math.random() * 360;
        // Colors
        var r = Math.round(Math.random() * 255);
        var g = Math.round(Math.random() * 255);
        var b = Math.round(Math.random() * 255);
        var a = Math.random();
        this.rgba = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    }

    // Draw the particles
    function draw() {
        // Re-paint the background
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.fillStyle = "white";
            ctx.fillRect(p.location.x, p.location.y, p.radius, p.radius);

            // Move the particles and create ribbons
            for (var n = 0; n < particles.length; n++) {
                var p2 = particles[n];
                var yd = p2.location.y - p.location.y;
                var xd = p2.location.x - p.location.x;
                var distance = Math.sqrt(xd * xd + yd * yd);

                // Draw a line between both particles if they are within 200px range
                if (distance < 200) {
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.location.x, p.location.y);
                    ctx.lineTo(p2.location.x, p2.location.y);
                    ctx.strokeStyle = p.rgba;
                    ctx.stroke();
                }
            }

            // Move particle using vectors
            p.location.x = p.location.x + p.speed * Math.cos(p.angle * Math.PI / 180);
            p.location.y = p.location.y + p.speed * Math.sin(p.angle * Math.PI / 180);

            // Wrap the particles around the edges of the canvas
            if (p.location.x < 0) p.location.x = W;
            if (p.location.x > W) p.location.x = 0;
            if (p.location.y < 0) p.location.y = H;
            if (p.location.y > H) p.location.y = 0;
        }
    }

    // Draw the ribbons continuously
    setInterval(draw, 30);
}