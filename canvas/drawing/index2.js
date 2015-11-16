var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var radius = 10;
var ready = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

context.lineWidth = radius * 2;

document.addEventListener('mousedown', startDraw);
document.addEventListener('mousemove', putPoints);
document.addEventListener('mouseup', stopDraw);

function startDraw(event) {
  ready = true;
  putPoints(event);
}

function putPoints(event) {

  if (ready) {

    context.lineTo(event.clientX, event.clientY);
    context.stroke();

    context.beginPath();
    context.arc(event.clientX, event.clientY, radius, 0, 2 * Math.PI);
    context.fill();

    context.beginPath();
    context.moveTo(event.clientX, event.clientY);

  }

}

function stopDraw() {
  ready = false;
  context.beginPath();
}
