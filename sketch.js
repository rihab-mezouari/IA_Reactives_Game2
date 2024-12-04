let vehicule;
let target;
let obstacles = [];
let vehicules = [];
let imageVehicule;
let obstacleImage;
let imagebackground ;
let wander_comportement = false; 
let currentMode = "normal";
function preload() {
  imageVehicule = loadImage('./assets/vehicule.png');

  obstacleImage = loadImage('./assets/planete_spatiale.png');
  imagebackground=loadImage('./assets/space3.jpg');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  let vehicule = new Vehicle(100, 100, imageVehicule); 

  vehicules.push(vehicule);

  // On cree un obstace au milieu de l'écran
  // un cercle de rayon 100px
  // TODO
  obstacles.push(new Obstacle(width / 2, height / 2, 100, obstacleImage));
}


function draw() {
 
  image(imagebackground,0,0,width+500,height+300);

  target = createVector(mouseX, mouseY);

  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 32);

  // dessin des obstacles
  // TODO
  obstacles.forEach(o => o.show());;

  vehicules.forEach((v, s) => {
    if (currentMode === "snake") {
      let steeringForce;
  
      // Taille du véhicule
      v.r = 40;
  
      if (s === 0) {
          // Le premier vehicule suit la souris
          steeringForce = v.arrive(target);
  
          // Si la souris  est fixe
          if (p5.Vector.dist(target, v.pos) < 1) {
              // Réduire la vitesse pour laisser un espace entre les vehicules 
              v.vel.mult(0.9);
          }
      } else {
          // Le véhicule actuel suit le precedent 
          let vehiculePrecedent = vehicules[s - 1];
          const distanceEntreVehicules = 85; // Distance qu'on veut entre les vehicules
  
          // Vérifier la distance 
          let distance = v.pos.dist(vehiculePrecedent.pos);
  
          if (distance > distanceEntreVehicules) {
              // Si la distance est trop grande, continuer à suivre
              steeringForce = v.suivre(
                  vehiculePrecedent.pos,
                  distanceEntreVehicules
              );
          } else if (distance < distanceEntreVehicules) {
              // Si la distance est trop petite, ralentir
              v.vel.mult(0.9); // reduit la vitesse
              steeringForce = createVector(0, 0); // on arrete force
          }
      }
  
      // Ajouter la force pour eviter les obstacles
      const avoidForce = v.avoid(obstacles);
      steeringForce.add(avoidForce);
  
      // Appliquer la force 
      v.applyForce(steeringForce);
  }
     else if (wander_comportement) {
      // comportement wander
      v.wander();
      const avoidForce = v.avoid(obstacles);
      v.applyForce(avoidForce);
    } else {
      // Comportement normal 
      v.applyBehaviors(target, obstacles, vehicules);
    }
  
    v.update();
    v.show();
  });
   // Dessiner un menu
   fill(255);
   textSize(16);
   textAlign(LEFT, TOP);
   text("- [S] Mode Serpent    - [N] Mode Normal    - [W] Mode Wander   - [V] Ajouter un véhicule   - [F] Ajouter 10 véhicules    - [D]  le mode Debug   - Cliquez pour ajouter un obstacle", 20, 20);
   
}

function mousePressed() {
  // TODO : ajouter un obstacle de taille aléatoire à la position de la souris
  obstacles.push(new Obstacle(mouseX, mouseY, random(50, 150), obstacleImage));
}

function keyPressed() {
  if (key === "s") {
    // Activer le mode serpent et désactiver les autres modes
    currentMode = "snake";
    wander_comportement = false;
  } else if (key === "n") {
    // Retour au mode normal
    currentMode = "normal";
    wander_comportement = false;
  } else if (key === "w") {
    // Activer/désactiver le mode wander 
    currentMode = "wander";
    wander_comportement = !wander_comportement;
  }

  if (key == "v") {
    // Crée un vehicule avec l'image
    vehicules.push(new Vehicle(random(width), random(height), imageVehicule));
  }
  
  if (key == "d") {
    // Active ou desactive le mode debug
    Vehicle.debug = !Vehicle.debug;
  } else if (key == "f") {
    // Creer 10 véhicules
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(20 + i * 50, height / 2, imageVehicule);
      v.vel = new p5.Vector(random(1, 5), random(1, 5)); // Vitesse aleatoire
      vehicules.push(v);
    }
  }
}

