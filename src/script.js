"use strict";

const round = (value, precision = 3) => parseFloat(value.toFixed(precision));

const clamp = (value, min = 0, max = 100 ) => {
	return Math.min(Math.max(value, min), max);
};

const adjust = (value, fromMin, fromMax, toMin, toMax) => {
	return round(toMin + (toMax - toMin) * (value - fromMin) / (fromMax - fromMin));
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

class RotationTracker {
    constructor(elementRef) {
        this.$element = elementRef;
        this._rotateFactor = { x: 4.5, y: 3 };

        this.$element.addEventListener("pointermove", this.interact.bind(this));
        this.$element.addEventListener("deviceorientation", this.orientate.bind(this));
    }

    interact(e) {
        if (e.type === "touchmove") {
            e.clientX = e.touches[0].clientX;
            e.clientY = e.touches[0].clientY;
        }

        const rect = this.$element.getBoundingClientRect(); // get element's current size/position
        const absolute = {
            x: e.clientX - rect.left, // get mouse position from left
            y: e.clientY - rect.top, // get mouse position from right
        };

        const percent = {
            x: clamp(round((100 / rect.width) * absolute.x)),
            y: clamp(round((100 / rect.height) * absolute.y)),
        };
        const center = {
            x: percent.x - 50,
            y: percent.y - 50,
        };


        this.updateSprings({
            x: adjust(percent.x, 0, 100, 37, 63),
            y: adjust(percent.y, 0, 100, 33, 67),
        },{
            x: round(-(center.x / this._rotateFactor.x)),
            y: round(center.y / this._rotateFactor.y),
        },{
            x: round(percent.x),
            y: round(percent.y),
            o: 1,
        });
    }

    orientate(e) {
        const x = e.relative.gamma;
        const y = e.relative.beta;
        const limit = { x: 16, y: 18 };

        const degrees = { 
            x: clamp(x, -limit.x, limit.x), 
            y: clamp(y, -limit.y, limit.y) 
        };

        updateSprings({
            x: adjust(degrees.x, -limit.x, limit.x, 37, 63),
            y: adjust(degrees.y, -limit.y, limit.y, 33, 67),
        },{
            x: round(degrees.x * -1),
            y: round(degrees.y),
        },{
            x: adjust(degrees.x, -limit.x, limit.x, 0, 100),
            y: adjust(degrees.y, -limit.y, limit.y, 0, 100),
            o: 1,
        });

    }

    updateSprings(background, rotate, glare) {
        this.$element.style.cssText = `
            --pointer-x: ${glare.x}%;
            --pointer-y: ${glare.y}%;
            --pointer-from-center: ${ 
            clamp( Math.sqrt( 
                (glare.y - 50) * (glare.y - 50) + 
                (glare.x - 50) * (glare.x - 50) 
            ) / 50, 0, 1) };
            --pointer-from-top: ${glare.y / 100};
            --pointer-from-left: ${glare.x / 100};
            --card-opacity: ${glare.o};
            --rotate-x: ${rotate.x}deg;
            --rotate-y: ${rotate.y}deg;
            --background-x: ${background.x}%;
            --background-y: ${background.y}%;
            --card-scale: 1;
        `;
    }
}

const STAR_MAX_RADIUS = 6;

class Star {
    constructor(center, canvasWidth, canvasHeight) {
        this.center = center;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = getRandomInt(-this.center.x, this.center.x);
        this.y = getRandomInt(-this.center.y, this.center.y);
        this.counter = getRandomInt(1, this.canvasWidth);

        this.radiusMax = 1 + Math.random() * STAR_MAX_RADIUS;
        this.speed = getRandomInt(1, 5);
    }

    drawStar(context) {
        this.counter -= this.speed;

        if (this.counter < 1) {
            this.counter = this.canvasWidth;
            this.x = getRandomInt(-this.center.x, this.center.x);
            this.y = getRandomInt(-this.center.y, this.center.y);

            this.radiusMax = getRandomInt(1, STAR_MAX_RADIUS);
            this.speed = getRandomInt(1, 5);
        }

        let xRatio = this.x / this.counter;
        let yRatio = this.y / this.counter;

        let starX = adjust(xRatio, 0, 1, 0, this.canvasWidth);
        let starY = adjust(yRatio, 0, 1, 0, this.canvasHeight);

        this.radius = adjust(this.counter, 0, this.canvasWidth, this.radiusMax, 0);

        context.beginPath();

        context.arc(starX, starY, this.radius, 0, Math.PI * 2, false);
        context.closePath();

        context.fillStyle = "#FFF";
        context.fill();
    }
}

class StarField {
    constructor(container, canvasRef, numStars = 500) {
        this.$canvas = canvasRef;
        this.$context = this.$canvas.getContext('2d');
        this.numStars = numStars;
        this.currentTime = 0;
        this.deltaTime = 0;
        this.previousTime = 0;
        this.fps = 60;
        this.interval = Math.floor(1000 / this.fps);
        this.drawing = false;

        this.stars = [];

        const rect = this.$canvas.getBoundingClientRect()
        this._width = rect.width;
        this._height = rect.height;
        this._center = { x: rect.width * 0.5, y: rect.height * 0.5 };

        this.$canvas.width = this._width;
        this.$canvas.height = this._height;

        for (let i = 0; i < this.numStars; i++) {
            let star = new Star(this._center, this._width, this._height);
            this.stars.push(star);
        }

        container.addEventListener("resize", () => {
            this._width = window.innerWidth;
            this._height = window.innerHeight;
            this._center = { x: this._width * 0.5, y: this._height * 0.5 };

            this.$canvas.width = this._width;
            this.$canvas.height = this._height;

            this.stars = [];
            for (let i = 0; i < this.numStars; i++) {
                let star = new Star(this._center, this._width, this._height);
                this.stars.push(star);
            }
        });
    }

    draw(timestamp) {
        if (!this.drawing) return;
        console.log("frame");

        this.currentTime = timestamp;
        this.deltaTime = this.currentTime - this.previousTime;

        if (this.deltaTime > this.interval) {
            this.previousTime = this.currentTime - (this.deltaTime % this.interval);

            this.$context.clearRect(0, 0, this._width, this._height);
            this.$context.fillStyle = "#111";
            this.$context.fillRect(0, 0, this._width, this._height);

            this.$context.translate(this._center.x, this._center.y);

            for (let i = 0; i < this.stars.length; i++) {
                let star = this.stars[i];
                star.drawStar(this.$context);
            }

            this.$context.translate(-this._center.x, -this._center.y);
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    start() {
        this.previousTime = performance.now();
        this.drawing = true;
        this.draw();
    }
}

let starfield;
let rotationTracker;

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is ready");
    rotationTracker = new RotationTracker(document.getElementById("logo"));
    starfield = new StarField(window, document.getElementById("starfield"), 250);
    starfield.start();
});