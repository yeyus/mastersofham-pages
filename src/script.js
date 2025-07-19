"use strict";

const round = (value, precision = 3) => parseFloat(value.toFixed(precision));

const clamp = (value, min = 0, max = 100 ) => {
	return Math.min(Math.max(value, min), max);
};

const adjust = (value, fromMin, fromMax, toMin, toMax) => {
	return round(toMin + (toMax - toMin) * (value - fromMin) / (fromMax - fromMin));
};

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

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is ready");

    const rotationTracker = new RotationTracker(document.getElementById("logo"));

});