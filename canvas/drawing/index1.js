var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var radius = 10;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.addEventListener('mousedown', drawPoint);

function drawPoint(event) {
  context.beginPath();

  context.arc(event.clientX, event.clientY, radius, 0, 2 * Math.PI);
  // context.arc(event.offsetX, event.offsetY, radius, 0, 2 * Math.PI);

  context.fill();
}
