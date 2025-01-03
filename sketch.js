let cam;
let player;
let chao;
let button;
let cursorImg;
let fonte;
let msgTeste;
let inimigoTeste;
let mundoCanvas;
const objetosFixos = [];
const objetosMoveis = [];
let objetos = [];

function preload() {
  player = new Player(64, 64);
  chao = new Floor(0, 0, 256, 256, [1, 2]);
  cam = new Camera(0, 0, 128, 128);
  button = new Button(8 * 2, 8 * 4, loadSprites("assets/sprites/button/", "button", 2));
  fonte = loadFont("assets/fonts/MinecraftStandard.otf");
  inimigoTeste = new Enemy(50, 50, 10);
}

function setup() {
  createCanvas(640, 640);
  mundoCanvas = createGraphics(128, 128);
  mundoCanvas.noSmooth();
  mundoCanvas.noStroke();
  mundoCanvas.pixelDensity(4);
  mundoCanvas.textSize(4);
  mundoCanvas.textFont(fonte);
  noSmooth();
  // textStyle(BOLD);
  // fill(255);
  noCursor();
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

  sortByZ(objetosFixos);

  //previne a pagina de scrollar
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

//MARK: DRAW
function draw() {
  mundoCanvas.background(0);
  cam.follow(player);

  //fisica
  player.move();
  //colocar em funcao separada
  for (let inimigo of Enemy.inimigos) {
    const info = player.hitbox.collidesWith(inimigo.hitbox);
    if (info.collided) {
      player.damage(3, inimigo);
    }
  }
  button.checkPress();

  sortByZ(objetosMoveis);
  ordenaObjetos();

  //render
  objetos.forEach((obj) => obj.display());
  msgTeste.follow(player.x, player.y - 10);
  msgTeste.speak();

  //mouse
  let pos = cam.getWorldMousePos();
  mundoCanvas.stroke(255);
  mundoCanvas.line(pos.x - 3, pos.y, pos.x + 3, pos.y);
  mundoCanvas.line(pos.x, pos.y - 3, pos.x, pos.y + 3);
  // text(player.z + " " + inimigoTeste.z, cam.x, cam.y);
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

function imageIfVisible(img, x, y) {
  //centro da tela = Camera.currentCamera.x, Camera.currentCamera.y
  //larg, altura da tela = Camera.currentCamera.w, Camera.currentCamera.h
  //da imagem = img.width, img.height

  const cam = Camera.currentCamera;
  if (
    y + img.height > cam.y - cam.h / 2 &&
    y < cam.y + cam.h / 2 &&
    x + img.width > cam.x - cam.w / 2 &&
    x < cam.x + cam.w / 2
  ) {
    mundoCanvas.image(img, x, y);
  }
}

function sortByZ(lista) {
  lista.sort((a, b) => a.z - b.z);
}

function ordenaObjetos() {
  objetos = [];
  let i = 0;
  let j = 0;
  while (i < objetosFixos.length && j < objetosMoveis.length) {
    if (objetosFixos[i].z <= objetosMoveis[j].z) {
      objetos.push(objetosFixos[i]);
      i++;
    } else {
      objetos.push(objetosMoveis[j]);
      j++;
    }
  }
  while (i < objetosFixos.length) {
    objetos.push(objetosFixos[i]);
    i++;
  }
  while (j < objetosMoveis.length) {
    objetos.push(objetosMoveis[j]);
    j++;
  }
}

//MARK: Entity class FIX
class Entity {
  constructor(shape, x, y, w, h) {
    this.hitbox = new Hitbox(shape, x, y, w, h);
  }
}

//MARK:Player class FIX
class Player extends Entity {
  constructor(x, y) {
    super("rect", x, y, 6, 3);
    this.x = x;
    this.y = y;
    this.z = y + 4;
    this.sprite;
    this.estado;
    this.lastEstado;
    this.health = 3;
    this.stunDuration = 0;

    const animAndar = new Animation("andar", loadSprites("assets/sprites/player/", "pl", 2), 5, true);
    const animIdle = new Animation("idle", loadSprites("assets/sprites/player/", "pl", 2), 40, true);
    this.animador = new SpriteAnimator(this, [animAndar, animIdle]);

    objetosMoveis.push(this);
  }

  move() {
    //MARK: TEMPORARIO ATE TER FISICA
    let dx = this.x;
    let dy = this.y;
    if (this.estado !== "stunned") {
      if (keyIsDown(68)) this.x++;
      if (keyIsDown(65)) this.x--;
      if (keyIsDown(83)) this.y++;
      if (keyIsDown(87)) this.y--;
      dx -= this.x;
      dy -= this.y;
    } else {
      this.stunDuration--;
    }
    this.z = this.y + 4;
    this.hitbox.follow(this.x - 3, this.y + 2);
    this.MEF(dx, dy);
  }

  applyForce(x, y) {
    this.x += x;
    this.y += y;
  }

  display() {
    this.animador.play();
    this.hitbox.debug();
    //desenha o player na origem transladada pra não ter problema invertendo a escala
    mundoCanvas.push();
    mundoCanvas.translate(this.x, this.y);
    if (cam.getWorldMousePos().x < this.x) mundoCanvas.scale(-1, 1);
    if (this.stunDuration % 4 <= 1) mundoCanvas.image(this.sprite, -4, -4);
    mundoCanvas.pop();
  }

  damage(amount, source) {
    this.health -= constrain(this.health - floor(amount), 0, this.health);
    this.stunDuration = 60;
    this.applyForce(this.hitbox.center.x - source.hitbox.center.x, this.hitbox.center.y - source.hitbox.center.y);
  }

  MEF(dx, dy) {
    if (dx != 0 || dy != 0) {
      this.estado = "movendo";
    } else {
      this.estado = "parado";
    }
    if (this.stunDuration > 0) {
      this.estado = "stunned";
    }

    //onstatechange
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
    if (newState == "stunned") {
      this.animador.pause();
    } else {
      this.animador.resume();
    }
  }
}

//MARK:Floor class FIX
class Floor {
  constructor(x, y, width, height, tiles) {
    this.x = x;
    this.y = y;
    this.z = y;
    this.width = width; // Largura do chão
    this.height = height; // Altura do chão
    this.tiles = tiles.map((tile) => loadImage("assets/sprites/tiles/tile" + tile + ".png"));
    objetosFixos.push(this);
  }

  display() {
    for (let y = this.y; y < this.y + this.height; y += 7) {
      for (let x = this.x; x < this.x + this.width; x += 8) {
        // Escolha um tile aleatório com base em alguma regra
        let index = floor(noise(x * 0.06, y * 0.06) * this.tiles.length);
        imageIfVisible(this.tiles[index], x, y);
      }
    }
  }
}

//MARK:Camera class
class Camera {
  static currentCamera;
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // this.limX = 336;
    // this.limY = 336;
    // this.scale = 1;
    Camera.currentCamera = this;
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
    mundoCanvas.push();
    mundoCanvas.translate(-this.x + mundoCanvas.width / 2, -this.y + mundoCanvas.height / 2);
  }

  display() {
    mundoCanvas.resetMatrix();
    mundoCanvas.pop();
    //pega os pixels do meio da tela e escala
    let tela = mundoCanvas.get(mundoCanvas.width / 2 - this.w / 2, mundoCanvas.height / 2 - this.h / 2, this.w, this.h);
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

//MARK:Button class FIX
class Button {
  constructor(x, y, imgsOnOff) {
    this.x = x;
    this.y = y;
    this.sprites = imgsOnOff;
    this.sprite = this.sprites[0];
    this.isPressed = false;
    this.z = y + this.sprite.height;
    objetosFixos.push(this);
  }

  display() {
    if (this.isPressed) this.sprite = this.sprites[1];
    else this.sprite = this.sprites[0];
    imageIfVisible(this.sprite, this.x, this.y);
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
    mundoCanvas.push();
    mundoCanvas.textAlign(this.mode);
    mundoCanvas.noStroke();
    mundoCanvas.fill(255);
    if (this.mode == CENTER) {
      const largura = mundoCanvas.textWidth(this.text.slice(0, (this.speed * this.time) / 10));
      mundoCanvas.rect(
        this.x - largura / 2 - 5,
        this.y - mundoCanvas.textSize() - 1.5,
        largura + 10,
        mundoCanvas.textSize() + 3,
        5
      );
    } else {
      mundoCanvas.rect(
        this.x - 5,
        this.y - mundoCanvas.textSize(),
        mundoCanvas.textWidth(this.text.slice(0, (this.speed * this.time) / 10)) + 10,
        mundoCanvas.textSize() + 5,
        5
      );
    }
    mundoCanvas.fill(0);
    mundoCanvas.text(this.text.slice(0, (this.speed * this.time) / 10), this.x, this.y);
    mundoCanvas.pop();
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
    this.paused = false;
  }

  changeAnim(name) {
    this.lastAnim = this.currAnim = this.anims.filter((animObj) => animObj.name == name)[0];
    this.time = 0;
  }

  play() {
    if (!this.paused) {
      this.parent.sprite = this.currAnim.getImage(this.time);
      this.time++;
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
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

//MARK: Htibox class
class Hitbox {
  constructor(shape, x, y, w, h = w) {
    this.shape = shape; //"circle", "rect", "point"
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.r = w;
  }

  follow(x, y = x) {
    if (isObj(x)) {
      this.x = x.x;
      this.y = y.y;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  debug() {
    mundoCanvas.push();
    mundoCanvas.noFill();
    mundoCanvas.stroke(255);
    mundoCanvas.strokeWeight(1);
    if (this.shape == "rect") mundoCanvas.rect(this.x, this.y, this.w, this.h);
    else if (this.shape == "circle") mundoCanvas.circle(this.x, this.y, this.r * 2);
    else if (this.shape == "point") mundoCanvas.point(this.x, this.y);
    mundoCanvas.pop();
  }

  collidesWith(hitbox) {
    const collisionInfo = { collided: false, center: hitbox.center };
    if (this.shape == "rect") {
      if (hitbox.shape == "rect") {
        collisionInfo.collided = this.rectRectCol(this, hitbox);
      } else if (hitbox.shape == "circle") {
        collisionInfo.collided = this.rectCircleCol(this, hitbox);
      } else if (hitbox.shape == "point") {
        collisionInfo.collided = this.rectPointCol(this, hitbox);
      }
    } else if (this.shape == "circle") {
      if (hitbox.shape == "rect") {
        collisionInfo.collided = this.rectCircleCol(hitbox, this);
      } else if (hitbox.shape == "circle") {
        collisionInfo.collided = this.circleCircleCol(this, hitbox);
      } else if (hitbox.shape == "point") {
        collisionInfo.collided = this.circlePointCol(this, hitbox);
      }
    } else if (this.shape == "point") {
      if (hitbox.shape == "rect") {
        collisionInfo.collided = this.rectPointCol(hitbox, this);
      } else if (hitbox.shape == "circle") {
        collisionInfo.collided = this.circlePointCol(hitbox, this);
      } else if (hitbox.shape == "point") {
        if (this.x == hitbox.x && this.y == hitbox.y) {
          collisionInfo.collided = true;
        }
      }
    }
    return collisionInfo;
  }

  rectCircleCol(r, c) {
    let testx = c.x,
      testy = c.y;
    if (testx < r.x) testx = r.x;
    else if (testx > r.x + r.w) testx = r.x + r.w;
    if (testy < r.y) testy = r.y;
    else if (testy > r.y + r.h) testy = r.y + r.h;

    if (dist(c.x, c.y, testx, testy) < c.r) {
      return true;
    }
    return false;
  }

  rectPointCol(r, p) {
    if (r.x < p.x && r.x + r.w > p.x && p.y > r.y && p.y < r.y + r.h) {
      return true;
    }
    return false;
  }

  rectRectCol(r1, r2) {
    if (r1.x + r1.w > r2.x && r1.x < r2.x + r2.w && r1.y + r1.h > r2.y && r1.y < r2.y + r2.h) {
      return true;
    }
    return false;
  }

  circlePointCol(c, p) {
    if (dist(c.x, c.y, p.x, p.y) < c.r) {
      return true;
    }
    return false;
  }

  circleCircleCol(c1, c2) {
    if (dist(c1.x, c1.y, c2.x, c2.y) < c1.r + c2.r) {
      return true;
    }
    return false;
  }

  get center() {
    if (this.shape == "rect") {
      return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    } else {
      return { x: this.x, y: this.y };
    }
  }
}

//MARK: Enemy class FIX
class Enemy extends Entity {
  static inimigos = [];
  constructor(x, y, dmg) {
    super("rect", x + 2, y + 7, 4, 3);
    this.x = x;
    this.y = y;
    this.damage = dmg;
    this.estado = "spawned";
    this.sprite = loadImage("assets/sprites/enemy/skel2.png");
    this.z = y + 8;
    objetosMoveis.push(this);
    Enemy.inimigos.push(this);
  }

  move() {
    this.hitbox.follow(this.x, this.y);
  }

  display() {
    this.hitbox.debug();
    imageIfVisible(this.sprite, this.x, this.y);
  }

  MEF() {}
}
