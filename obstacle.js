class Obstacle {
  constructor(x, y, taille, image) {
    this.pos = createVector(x, y); // Position
    this.taille = taille;         // Taille de l'obstacle
    this.image = image;           // Image associée
    this.r = taille / 2;  
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    imageMode(CENTER);
    image(this.image, 0, 0, this.taille, this.taille); // Taille dynamique
    pop();
  }
}
