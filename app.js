var laps = 0;
var scaling = 15;
var cars = [];

var canvasTrack, context, trackHeight, trackWidth;

var hexes = {
  "#000000" : "road",
  "#8fcf4b" : "grass",
  "#2194ca" : "water",
  "#ffffff" : "finish",
  "#a9a9a9" : "ledge",
  "#373737" : "overpass"
}

function prepareTrack(level){
  canvasTrack = $("canvas");
  context = canvasTrack[0].getContext("2d");

  var image = new Image();
  $("body").append(image);
  $(image).hide();
  image.src = '/tracks/' + level;

  $(".track").css("background-image", "url(/tracks/"+level+")");

  $(image).on("load",function(){
    context.drawImage(image, 0, 0);
    trackHeight = $(this).height();
    trackWidth = $(this).width();
    $(".track").height(trackHeight * scaling);
    $(".track").width(trackWidth * scaling);
    canvasTrack.height(trackHeight);
    canvasTrack.width(trackWidth);
  });
}


function trackAnimation(){
  $(".track-wrapper").addClass("trackpop");

  setTimeout(function(){
    $(".track-wrapper").removeClass("trackpop");
  },200);
}

var tracks = ["eight.png","oval.png"];

function loadRandomTrack(){
  var trackCount = tracks.length;
  var random = Math.floor(Math.random() * trackCount);
  prepareTrack(tracks[random]);
}


$(document).ready(function(){

  var car = newCar("one");
  cars.push(car);

  // var cartwo = newCar("two");
  // cars.push(cartwo);
  loadRandomTrack();


  $(window).on("keydown",function(e){
    var direction;

    if(e.keyCode == 37) {
      cars[0].direction = "left";
    }
    if(e.keyCode == 65) {
      cars[1].direction = "left";
    }

    if(e.keyCode == 39) {
      cars[0].direction = "right";
    }
    if(e.keyCode == 68) {
      cars[1].direction = "right";
    }

    if(e.keyCode == 38) {
      cars[0].direction = "up";
    }
    if(e.keyCode == 87) {
      cars[1].direction = "up";
    }

    if(e.keyCode == 40) {
      cars[0].direction = "down";
    }
    if(e.keyCode == 83) {
      cars[1].direction = "down";
    }

  });

  gameLoop();

});

var time;
var delta;
var elapsedTime = 0;

function gameLoop() {

  var now = new Date().getTime();
  delta = now - (time || now);
  time = now;

  var xtotal = 0;
  var ytotal = 0;

  for(var i = 0; i < cars.length; i++){
    var car = cars[i];

    if(car.ticks > 11 - car.speed){
      driveCar(car);
      car.ticks = 0;
    }

    car.laptime = car.laptime + delta;
    car.ticks++;
    xtotal = xtotal + car.x;
    ytotal = ytotal + car.y;


    $(".lap-time").text(formatTime(elapsedTime));

    $(".laps-"+car.name).find(".lap-count").text(car.laps);
    $(".laps-"+car.name).find(".lap-time").text(formatTime(car.laptime));

  }

  var xavg = xtotal / cars.length;
  var yavg = ytotal / cars.length;

  var xdeg = 5 * (-1 + (2 * xavg / trackWidth));
  var ydeg = 30 + 5 * (1 - (2 * yavg / trackHeight));
  $(".track").css("transform","rotateX(" +ydeg+"deg) rotateY("+xdeg+"deg)");

  window.requestAnimationFrame(gameLoop);
}

function formatTime(total){
  var ms = Math.floor(total / 10 % 100);
  if(ms < 10){
    ms = "0" + ms;
  }
  var sec = Math.floor(total / 1000 % 60);

  return sec + "." + ms;
}


function driveCar(car) {

  var currentPosition = checkPosition(car.x,car.y);

  var xd = 0;
  var yd = 0;

  if(car.direction == "up") { yd-- }
  if(car.direction == "down") { yd++ }
  if(car.direction == "left") { xd-- }
  if(car.direction == "right") { xd++ }

  var nextPosition = checkPosition(car.x + xd,car.y + yd);

  var move = true;

  if(nextPosition == "grass"){
    move = false;
  }

  if(car.mode == "normal") {
    if(currentPosition == "overpass" && nextPosition == "ledge" ) {
      move = false;
    }
    if(currentPosition == "road" && nextPosition == "ledge" ) {
      car.mode = "under";
    }
  } else if (car.mode == "under") {
    if(currentPosition == "overpass" && nextPosition == "road"){
      move = false;
    }
    if(currentPosition == "ledge" && nextPosition == "road" ) {
      car.mode = "normal";
    }

  }

  if(move){
    car.x = car.x + xd;
    car.y = car.y + yd;

  } else {
    car.speed = car.startspeed;
  }

  car.el.attr("speed",car.speed);
  car.el.attr("direction",car.direction);
  car.el.attr("mode",car.mode);

  if(car.direction != "none"){
    car.history.push(car.direction);
  }

  if(car.history.length > car.speed + 1) {
    car.history = car.history.slice(1, car.speed + 2);
  }

  var same = true;

  if(car.history.length > car.speed) {
    for(var i = 0; i < car.history.length; i++){
      if(car.history[0] != car.history[i]){
        same = false;
      }
    }
  } else {
    same = false;
  }

  if(same == true){
    car.speed = car.speed + 1;
    car.history = [];
  }

  if(nextPosition == "finish" && car.direction == "left"){
    car.laps++;

    if(car.laptime < car.bestlap || car.bestlap == 0) {
      car.bestlap = car.laptime;
    }

    $(".laps-"+car.name).find(".best-time").text(formatTime(car.bestlap));

    car.laptime = 0;
    trackAnimation();
  }

  if(nextPosition == "finish" && car.direction == "right"){
    car.laps--;
  }

  if(nextPosition == "water") {
    if(car.speed > 5){
      car.speed = 5;
    }
  }

  if(car.speed > car.maxspeed) {
    car.speed = car.maxspeed;
  }

  if(nextPosition == "grass") {
    car.speed = 1;
  }

  car.el.css("transform", "translateY("+car.y * scaling+"px) translateX("+car.x * scaling+"px)");
}

function checkPosition(x,y){
  var p = context.getImageData(x, y, 1, 1).data;
  var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
  return hexes[hex];
}

function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255)
    throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}


function newCar(name){

  var car = {
    id : cars.length,
    name : name,
    x : 4,
    laps : 0,
    maxspeed : 10,
    y : 14,
    ticks : 0,
    direction : "right",
    speed : 2,
    bestlap : 0,
    laptime: 0,
    mode: "normal",
    startspeed: 2
  };

  car.el = $("<div class='car " +name + "'/>");
  car.el.width(scaling);
  car.el.height(scaling);
  $(".track").append(car.el)


  car.history = new Array();
  return car;
}
