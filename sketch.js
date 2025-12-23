/*
Assets Used:

Background Images:
gameBg.jpg - https://depositphotos.com/vectors/pixel-winter.html
gameOver.jpg - https://www.shutterstock.com/image-vector/winter-village-landscape-merry-christmas-greeting-2369191329

Building Images:
buildings: All from asset pack (apartments, hotel, and houses) - https://the-pixel-nook.itch.io/rpg-building-pack (Converted to pixel art)

Font:
Tiny5-Regular.ttf - https://fonts.google.com/specimen/Tiny5

Flying Object Images:
objects: All from asset pack - https://akari21.itch.io/christmas

Player Gif Image:
playerSleigh.gif - https://giphy.com/stickers/christmas-mcdonalds-mcdo-G6YeoREFD51IwvfZQH

Present Images:
presents: All from asset pack - https://stylezmj.itch.io/presents

*/

//Object that will store the main game background images
let gameBgs = { img: null, x1: 0, x2: 900, speed: 4.5 }

//Object that will store the game over & welcome screen background image
let gameOverBg = { img: null, x: 0, y: - 75 }

//Object that will store the properties of the player
let player = {
  x: 20, y: 20, width: 150, speed: 7.5, img: null, controls: {
    up: 38,
    up2: 87,
    down: 40,
    down2: 83,
    drop: 32,
  },
  hitbox: {
    width: 67,
    height: 23,
    xOffset: 50,
    yOffset: 80,
  }
}

//Array of object images
let objectImages = []

//Array of flying objects
let flyingObjects = []

//Array of large present images
let largePresentImages = []

//Array of small present images
let smallPresentImages = []

//Array of presents
let presents = []

//Array of apartment building images
let apartmentImages = []

//Array of house images
let houseImages = []

//Hotel image variable
let hotelImage

//Array of building objects
let buildings = []

//Variable to keep track of score
let score = 0

//Variable to store time remaining (starts at 12 seconds)
let timeRemaining = 12

//Variable to store when game started
let gameStartTime = 0

//Variable to store time alive
let timeAlive = 0

//Variable to store current screen
let screen = 1

function preload() {
  //Load the main game background image
  gameBgs.img = loadImage("/assets/backgrounds/gameBg.jpg")

  //Load the game over screen background image
  gameOverBg.img = loadImage("/assets/backgrounds/gameOver.jpg")

  //Load the player gif
  player.img = loadImage("/assets/player/playerSleigh.gif")

  //Load the object images
  for (let i = 1; i <= 8; i++) {
    objectImages.push(loadImage(`/assets/objects/${i}.png`))
  }

  //Load the large present images
  for (let i = 1; i <= 4; i++) {
    largePresentImages.push(loadImage(`/assets/presents/largePresent${i}.png`))
  }

  //Load the small present images
  for (let i = 1; i <= 5; i++) {
    smallPresentImages.push(loadImage(`/assets/presents/smallPresent${i}.png`))
  }

  //Load the apartment images
  for (let i = 1; i <= 2; i++) {
    apartmentImages.push(loadImage(`/assets/buildings/apartment${i}.png`))
  }

  //Load the house images
  for (let i = 1; i <= 3; i++) {
    houseImages.push(loadImage(`/assets/buildings/house${i}.png`))
  }

  //Load the hotel image
  hotelImage = loadImage(`/assets/buildings/hotel.png`)

  //Font to use for the text
  font = loadFont("/assets/font/Tiny5-Regular.ttf")
}

//Create the background
function drawGameBackground() {
  image(gameBgs.img, gameBgs.x1, 0, gameBgs.img.width * 1.5, gameBgs.img.height * 1.5)
  gameBgs.x1 -= gameBgs.speed

  image(gameBgs.img, gameBgs.x2, 0, gameBgs.img.width * 1.5, gameBgs.img.height * 1.5)
  gameBgs.x2 -= gameBgs.speed

  //Create seamless background
  if (gameBgs.x1 < -width) {
    gameBgs.x1 = width
  }
  if (gameBgs.x2 < -width) {
    gameBgs.x2 = width
  }
}

function drawPlayer() {
  image(player.img, player.x, player.y, player.width, player.width)
}

function updatePlayer() {
  let controls = player.controls
  // Up and Down Movement
  if (keyIsDown(controls.up) || keyIsDown(controls.up2)) {
    player.y -= player.speed
  } else if (keyIsDown(controls.down) || keyIsDown(controls.down2)) {
    player.y += player.speed
  }

  if (keyIsDown(controls.drop) && frameCount % 20 == 0) {
    presents.push(createPresent(player.x + 75, player.y + 75))
  }
}

function keepOnScreen() {
  player.y = constrain(player.y, 0 - 40, 275)
}

function intializeObjects() {
  for (let i = 0; i <= 9; i++) {
    flyingObjects.push(createObject())
  }
}

function createObject() {
  return {
    x: random(width, width * 2),
    y: random(0, 300),
    speed: 6,
    img: objectImages[int(random(0, 8))],
    width: 48
  }
}

function drawObject(object) {
  image(object.img, object.x, object.y, object.width, object.width)
}

function updateObject(object) {
  object.x -= object.speed
  if (object.x < 0 - object.img.width) {
    object.x = random(width, width * 2)
    object.y = random(0, 323)
  }
}

function createPresent(x, y) {
  let presentType = int(random(0, 2))
  return {
    x: x,
    y: y,
    speed: 6.5,
    img: presentType == 0 ? largePresentImages[int(random(0, 4))] : smallPresentImages[int(random(0, 5))],
    width: presentType == 1 ? 512 / 16 : 32
  }
}

function drawPresent(present) {
  image(present.img, present.x, present.y, present.width, present.width)
}

function updatePresents(present) {
  present.y += present.speed
  if (present.y > height) {
    presents.splice(presents.indexOf(present), 1)
  }
}

function initializeBuildings() {
  for (let i = 0; i <= 5; i++) {
    buildings.push(createBuilding())
  }
}

function createBuilding() {
  let buildingType = int(random(0, 3))
  return {
    x: generateBuildingLocation(0, 850),
    y: 410,
    speed: 4.5,
    img: buildingType == 0 ? apartmentImages[int(random(0, 2))] : buildingType == 1 ? houseImages[int(random(0, 3))] : hotelImage
  }
}

function generateBuildingLocation(min, max) {
  let minSpacing = 100
  let generatedX = random(min, max)
  let lookingForLocation = true;

  while (lookingForLocation) {
    let validLocation = true
    for (let building of buildings) {
      if (abs(generatedX - building.x) < minSpacing) {
        validLocation = false
        break
      }
    }
    if (validLocation) {
      lookingForLocation = false
    } else {
      generatedX = random(min, max)
    }
  }
  return generatedX
}

function drawBuilding(building) {
  image(building.img, building.x, building.y)
}

function updateBuilding(building) {
  building.x -= building.speed
  if (building.x < 0 - building.img.width) {
    let buildingType = int(random(0, 3))
    building.x = generateBuildingLocation(width, width * 2)
    building.img = buildingType == 0 ? apartmentImages[int(random(0, 2))] : buildingType == 1 ? houseImages[int(random(0, 3))] : hotelImage
  }
}

function checkGiftDrop(buildings, presents) {
  for (let i = 0; i < buildings.length; i++) {
    for (let j = 0; j < presents.length; j++) {
      if (presents[j].x < buildings[i].x + buildings[i].img.width &&
        presents[j].x + presents[j].width > buildings[i].x &&
        presents[j].y < buildings[i].y + buildings[i].img.width &&
        presents[j].y + presents[j].width > buildings[i].y) {
        presents.splice(j, 1)
        score += 1
      }
    }
  }
}

function updateTimer() {
  if (screen == 2) {
    let elapsed = (millis() - gameStartTime) / 1000
    timeRemaining = max(0, 12 - elapsed)
  }
}

function showTimer() {
  push()
  textFont(font)
  textSize(40)

  // Change color based on time remaining
  if (timeRemaining > 5) {
    fill("limegreen")
  } else if (timeRemaining > 2) {
    fill("orange")
  } else {
    fill("red")
  }

  stroke("white")
  strokeWeight(5)
  textAlign(RIGHT, TOP)
  text(`Time: ${timeRemaining.toFixed(1)}s`, width - 10, 0)
  pop()
}

function checkPlayerCollision(objects, player) {
  for (let i = 0; i < objects.length; i++) {
    if (player.x + player.hitbox.xOffset < objects[i].x + objects[i].width &&
      player.x + player.hitbox.xOffset + player.hitbox.width > objects[i].x &&
      player.y + player.hitbox.yOffset < objects[i].y + objects[i].width &&
      player.y + player.hitbox.yOffset + player.hitbox.height > objects[i].y) {
      // Remove 2 seconds from timer when hit
      gameStartTime -= 2000
      objects[i].x = random(width, width * 2)
      objects[i].y = random(0, 300)
      break
    }
  }
}

function endGame() {
  if (timeRemaining <= 0) {
    screen = 3
  }
}

function showScore() {
  push()
  textFont(font)
  textSize(40)
  fill("goldenrod")
  stroke("white")
  strokeWeight(5)
  textAlign(LEFT, TOP)
  text(`Score: ${score}`, 10, 0)
  pop()
}

function timeElapsed() {
  if (screen == 2 && frameCount % 60 == 0) {
    timeAlive += 1
  }
}

function startScreen() {
  push()
  image(gameOverBg.img, gameOverBg.x, gameOverBg.y, gameOverBg.img.width * 0.65, gameOverBg.img.height * 0.6)
  fill("red")
  textFont(font)
  textAlign(CENTER, CENTER)
  textSize(80)
  text("Santa's Gift Drop!", width / 2, height / 2 - 220)
  image(largePresentImages[2], width / 2 - 380, height / 2 - 236, 64, 64)
  image(largePresentImages[0], width / 2 + 305, height / 2 - 236, 64, 64)
  textSize(40)
  fill("white")
  strokeWeight(0)
  text("Survive 12 Seconds and Deliver Presents!", width / 2, height / 2 - 165)
  fill("goldenrod")
  textSize(30)
  stroke("white")
  strokeWeight(4)
  text("Controls:", width / 2, height / 2 - 125)
  text("W/Up Arrow - Move Up", width / 2, height / 2 - 95)
  text("S/Down Arrow - Move Down", width / 2, height / 2 - 65)
  text("Hold Spacebar - Drop Presents", width / 2, height / 2 - 35)
  fill("red")
  strokeWeight(0)
  textSize(25)
  strokeWeight(4)
  stroke("white")
  fill("goldenrod")
  text("(Hitting objects removes 2 seconds!)", width / 2, height / 2 - 5)
  textSize(50)
  fill("forestgreen")
  if (frameCount % 90 < 45) {
    text("Press Any Key to Begin", width / 2, 445)
  }
  beginGame()
  pop()
}

function beginGame() {
  if (screen == 1 & keyIsPressed) {
    screen = 2
    gameStartTime = millis()
    timeRemaining = 12
  }
}

function mainGame() {
  push()
  //Background
  drawGameBackground()

  //Player
  drawPlayer()
  updatePlayer()
  keepOnScreen()

  //Flying objects
  for (let i = 0; i < flyingObjects.length; i++) {
    drawObject(flyingObjects[i])
    updateObject(flyingObjects[i])
  }

  //Presents
  for (let i = 0; i < presents.length; i++) {
    drawPresent(presents[i])
    updatePresents(presents[i])
  }

  //Buildings
  for (let i = 0; i < buildings.length; i++) {
    drawBuilding(buildings[i])
    updateBuilding(buildings[i])
  }

  //Checking Collisions
  checkGiftDrop(buildings, presents)
  checkPlayerCollision(flyingObjects, player)

  //Timer
  updateTimer()
  showTimer()

  showScore()
  timeElapsed()
  endGame()
  pop()
}

function gameOver() {
  image(gameOverBg.img, gameOverBg.x, gameOverBg.y, gameOverBg.img.width * 0.65, gameOverBg.img.height * 0.6)
  textFont(font)
  fill("forestgreen")
  strokeWeight(0)
  textAlign(CENTER, CENTER)
  textSize(80)
  text("Game Over!", width / 2, height / 2 - 225)
  fill("goldenrod")
  textSize(50)
  stroke("white")
  strokeWeight(5)
  text(`Presents Delivered: ${score}`, width / 2, height / 2 - 125)
  fill("red")
  strokeWeight(0)
  if (frameCount % 90 < 45) {
    text("Press R to Restart", width / 2, 445)
  }
  restartGame()
}

function restartGame() {
  if (screen == 3 && keyIsDown(82)) {
    score = 0
    timeRemaining = 12
    flyingObjects = []
    presents = []
    buildings = []
    player.x = 20
    player.y = 20
    timeAlive = 0
    intializeObjects()
    initializeBuildings()
    screen = 2
    gameStartTime = millis()
  }
}

function setup() {
  createCanvas(900, 505)
  //Initialize the flying objects
  intializeObjects()
  //Initialize the buildings
  initializeBuildings()
}


function draw() {
  if (screen == 1) {
    startScreen()
  }
  else if (screen == 2) {
    mainGame()
  }
  else if (screen == 3) {
    gameOver()
  }
}