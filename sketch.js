let cam;
let player;
let chao;
let button;

function preload() {
  player = new Player(64, 64);
  chao = new Floor(0, 0, 1);
  cam = new Camera(0, 0, 128, 128);
  button = new Button(8 * 2, 8 * 4, [loadImage("assets/button1.png"), loadImage("assets/button2.png")]);
}

function setup() {
  createCanvas(640, 640);
  noSmooth();
  noStroke();
  textSize(5);
  textStyle(BOLD);
  fill(255);

  //previne a pagina de scrollar
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

function draw() {
  background(0);
  //fisica
  cam.follow(player.x, player.y);
  player.move();
  button.checkPress();

  //render
  chao.display();
  button.display();
  player.display();
  // text("oie galera", cam.x, cam.y);
  cam.display();
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = loadImage("assets/pl1.png");
  }

  move() {
    if (keyIsDown(RIGHT_ARROW)) this.x++;
    if (keyIsDown(LEFT_ARROW)) this.x--;
    if (keyIsDown(DOWN_ARROW)) this.y++;
    if (keyIsDown(UP_ARROW)) this.y--;
  }

  display() {
    //desenha o player na origem transladada pra não ter problema invertendo a escala
    push();
    translate(this.x, this.y);
    if (cam.getWorldMousePos().x < this.x) scale(-1, 1);
    image(this.sprite, -4, -4);
    pop();
  }
}

class Floor {
  constructor(x, y, tile) {
    this.x = x;
    this.y = y;
    this.sprite = loadImage(`assets/tile${tile}.png`);
  }

  display() {
    for (let y = this.y; y < this.y + 128; y += 7) {
      for (let x = this.x; x < this.x + 128; x += 8) {
        image(this.sprite, x, y);
      }
    }
  }
}

class Camera {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.limX = 336;
    this.limY = 336;
    this.scale = 1;
  }

  follow(alvoX, alvoY) {
    this.x = lerp(this.x, alvoX, 0.08);
    this.y = lerp(this.y, alvoY, 0.08);
    // this.x = constrain(this.x, -100000, this.limX);
    // this.y = constrain(this.y, -100000, this.limY);
    translate(-this.x + width / 2, -this.y + height / 2);
  }

  display() {
    resetMatrix();
    //pega os pixels do meio da tela e escala
    let tela = get(width / 2 - this.w / 2, height / 2 - this.h / 2, this.w, this.h);
    image(tela, 0, 0, width, height);
  }

  getWorldMousePos() {
    let x = map(mouseX, 0, width, this.x - this.w / 2, this.x + this.w / 2);
    let y = map(mouseY, 0, height, this.y - this.h / 2, this.y + this.h / 2);
    return { x: x, y: y };
  }
}

class Button {
  constructor(x, y, imgsOnOff) {
    this.x = x;
    this.y = y;
    this.sprites = imgsOnOff;
    this.sprite = this.sprites[0];
    this.isPressed = false;
  }

  display() {
    if (this.isPressed) this.sprite = this.sprites[1];
    else this.sprite = this.sprites[0];
    image(this.sprite, this.x, this.y);
  }

  checkPress() {
    if (dist(player.x, player.y + 3, this.x + 4, this.y + 3) < 4) this.isPressed = true;
    else this.isPressed = false;
  }
}
