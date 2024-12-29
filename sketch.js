let cam;
let player;
let chao;
let button;
let cursorImg;
let fonte;
let msgTeste;

function preload() {
  player = new Player(64, 64);
  chao = new Floor(0, 0, 256, 256, [1, 2]);
  cam = new Camera(0, 0, 128, 128);
  button = new Button(8 * 2, 8 * 4, loadSprites("assets/sprites/button/", "button", 2));
  fonte = loadFont("assets/fonts/MinecraftStandard.otf");
}

function setup() {
  createCanvas(640, 640);
  noSmooth();
  noStroke();
  textSize(4);
  // textStyle(BOLD);
  // fill(255);
  noCursor();
  textFont(fonte);
  msgTeste = new Speech(
    [
      ["olá galerinha do youtube!", 4],
      ["é com muito prazer que vos apresento", 4],
      ["o grande espetáculo...", 3],
      ["Deu a louca na Chapeuzinho 3!", 2],
      ["O teste para bolhas está completo.", 1],
    ],
    40,
    10,
    20
  );

  //previne a pagina de scrollar
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

function draw() {
  background(0);
  cam.follow(player);

  //fisica
  player.move();
  button.checkPress();

  //render
  chao.display();
  button.display();
  player.display();
  msgTeste.follow(player.x, player.y - 10);
  msgTeste.speak();

  let pos = cam.getWorldMousePos();
  stroke(255);
  line(pos.x - 3, pos.y, pos.x + 3, pos.y);
  line(pos.x, pos.y - 3, pos.x, pos.y + 3);
  // text("oie galera", cam.x, cam.y);
  // print(cam.worldToCam(cam.x, cam.y));

  cam.display();
}

function isObj(test) {
  return typeof test == "object";
}

function loadSprites(folder, baseName, count) {
  let imgarray = [];
  for (let i = 1; i <= count; i++) {
    let img = loadImage(folder + baseName + String(i) + ".png");
    imgarray.push(img);
  }
  return imgarray;
}

//MARK:Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.sprite;
    this.estado;
    this.lastEstado;

    const animAndar = new Animation("andar", loadSprites("assets/sprites/player/", "pl", 2), 5, true);
    const animIdle = new Animation("idle", loadSprites("assets/sprites/player/", "pl", 2), 40, true);
    this.animador = new SpriteAnimator(this, [animAndar, animIdle]);
  }

  move() {
    //MARK: TEMPORARIO ATE TER FISICA
    let dx = this.x;
    let dy = this.y;
    if (keyIsDown(68)) this.x++;
    if (keyIsDown(65)) this.x--;
    if (keyIsDown(83)) this.y++;
    if (keyIsDown(87)) this.y--;
    dx -= this.x;
    dy -= this.y;
    this.MEF(dx, dy);
  }

  display() {
    this.animador.play();
    //desenha o player na origem transladada pra não ter problema invertendo a escala
    push();
    translate(this.x, this.y);
    if (cam.getWorldMousePos().x < this.x) scale(-1, 1);
    image(this.sprite, -4, -4);
    pop();
  }

  MEF(dx, dy) {
    if (dx != 0 || dy != 0) {
      this.estado = "movendo";
    } else {
      this.estado = "parado";
    }
    if (this.estado != this.lastEstado) {
      this.onStateChange(this.lastEstado, this.estado);
      this.lastEstado = this.estado;
    }
  }

  onStateChange(oldState, newState) {
    if (newState == "movendo") {
      this.animador.changeAnim("andar");
    }
    if (newState == "parado") {
      this.animador.changeAnim("idle");
    }
  }
}

//MARK:Floor class
class Floor {
  constructor(x, y, width, height, tiles) {
    this.x = x;
    this.y = y;
    this.width = width; // Largura do chão
    this.height = height; // Altura do chão
    this.tiles = tiles.map((tile) => loadImage("assets/sprites/tiles/tile" + tile + ".png"));
  }

  display() {
    for (let y = this.y; y < this.y + this.height; y += 7) {
      for (let x = this.x; x < this.x + this.width; x += 8) {
        // Escolha um tile aleatório com base em alguma regra
        let index = floor(noise(x * 0.06, y * 0.06) * this.tiles.length);
        image(this.tiles[index], x, y);
      }
    }
  }
}

//MARK:Camera class
class Camera {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // this.limX = 336;
    // this.limY = 336;
    // this.scale = 1;
  }

  follow(alvoX, alvoY = alvoX) {
    if (isObj(alvoX)) {
      this.x = lerp(this.x, alvoX.x, 0.08);
      this.y = lerp(this.y, alvoX.y, 0.08);
    } else {
      this.x = lerp(this.x, alvoX, 0.08);
      this.y = lerp(this.y, alvoY, 0.08);
    }
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

  worldToCam(x, y = x) {
    let newX;
    let newY;
    if (isObj(x)) {
      newX = x.x - this.x + this.w / 2;
      newY = x.y - this.y + this.h / 2;
    } else {
      newX = x - this.x + this.w / 2;
      newY = y - this.y + this.h / 2;
    }
    return { x: newX, y: newY };
  }

  //   camToWorld(x,y){

  //   }

  // canvasToWorld(x,y){} //pra substituir getWorldMousePos
}

//MARK:Button class
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

//MARK: TimedText class
class TimedText {
  constructor(string, x, y, speed = 3, mode = CENTER) {
    //speed === chars a cada 10 frames
    this.time = 0;
    this.text = string;
    this.speed = speed > 0 ? speed : 1;
    this.mode = mode;
    this.x = x;
    this.y = y;
    this.finished = false;
  }

  tick() {
    if ((this.time * this.speed) / 10 >= this.text.length) this.finished = true;

    this.time++;
  }

  show() {
    this.tick();
    push();
    textAlign(this.mode);
    noStroke();
    fill(255);
    if (this.mode == CENTER) {
      const largura = textWidth(this.text.slice(0, (this.speed * this.time) / 10));
      rect(this.x - largura / 2 - 5, this.y - textSize() - 1.5, largura + 10, textSize() + 3, 5);
    } else {
      rect(
        this.x - 5,
        this.y - textSize(),
        textWidth(this.text.slice(0, (this.speed * this.time) / 10)) + 10,
        textSize() + 5,
        5
      );
    }
    fill(0);
    text(this.text.slice(0, (this.speed * this.time) / 10), this.x, this.y);
    pop();
  }

  follow(x, y = x) {
    if (isObj(x)) {
      this.x = x.x;
      this.y = x.y;
    } else {
      this.x = x;
      this.y = y;
    }
  }
}

//MARK: Speech class
class Speech {
  constructor(strings, timeInBetween, x, y) {
    //strings structure: [["",spd],["",spd]]
    this.textArray = [];
    for (let texto of strings) {
      this.textArray.push(new TimedText(texto[0], x, y, texto[1]));
    }
    this.timer = 0;
    this.delay = timeInBetween;
    this.textoDaVez = this.textArray[0];
  }

  tick() {
    if (this.textoDaVez.finished) {
      this.timer++;
      if (this.timer >= this.delay) {
        this.timer = 0;
        this.textArray.shift();
        this.textoDaVez = this.textArray[0];
      }
    }
  }

  speak() {
    if (this.textArray.length > 0) {
      this.textoDaVez.show();
      this.tick();
    }
  }

  follow(x, y = x) {
    if (this.textoDaVez != undefined)
      if (isObj(x)) {
        this.textoDaVez.follow(x);
      } else {
        this.textoDaVez.follow(x, y);
      }
  }
}
//MARK: SpriteAnimator class
class SpriteAnimator {
  constructor(parentObjReference, animationsArray) {
    this.time = 0;
    this.anims = animationsArray;
    this.parent = parentObjReference;
    this.currAnim = this.anims[0];
    this.lastAnim = this.currAnim;
    if (this.parent.sprite == undefined) this.parent.sprite = this.currAnim.getImage(0);
  }

  changeAnim(name) {
    this.lastAnim = this.currAnim = this.anims.filter((animObj) => animObj.name == name)[0];
    this.time = 0;
  }

  play() {
    this.parent.sprite = this.currAnim.getImage(this.time);
    this.time++;
  }
}
//MARK: Animation class
class Animation {
  constructor(name, spriteArray, delayInFrames, loop = true) {
    this.name = name;
    this.sprites = spriteArray;
    this.delay = delayInFrames;
    this.loop = loop;
  }

  getImage(time) {
    let index = floor(time / this.delay);
    if (this.loop) {
      index = index % this.sprites.length;
    } else {
      if (index >= this.sprites.length) index = this.sprites.length - 1;
    }
    return this.sprites[index];
  }
}
