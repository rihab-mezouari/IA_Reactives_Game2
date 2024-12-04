/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

class Vehicle {
  static debug = false;

  constructor(x, y, imageV) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 6;
    // force maximale appliquée au véhicule
    this.maxForce = 0.25;
    this.color = "white";
    // à peu près en secondes
    this.dureeDeVie = 5;
  
    this.r_pourDessin = 16;
    // rayon du véhicule pour l'évitement
    this.r = this.r_pourDessin * 3;
  
    // Pour évitement d'obstacle
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;
  
    // chemin derrière vaisseaux
    this.path = [];
    this.pathMaxLength = 30;
  
    // Image du véhicule
    this.image=imageV; // Nouvelle propriété pour l'image
     // pour comportement wander
     this.distanceCercle = 150;
    
     this.wanderRadius = 50;
     this.wanderTheta = PI / 2;
     this.displaceRange = 0.3;
  }
  suivre(position, distancevoulu = 60) {
    // Calculer la direction vers la position à suivre
    let direction = p5.Vector.sub(position, this.pos);
    let distance = direction.mag();
  
    // Avancer distance actuelle superieur a la distance voulu (si nest pas loin)
    if (distance > distancevoulu) {
      direction.setMag(this.maxSpeed); 
    } else {
      direction.setMag(0); // Arreter
    }
  
    let ajustement = p5.Vector.sub(direction, this.vel);
    ajustement.limit(this.maxForce); 
    return ajustement;
  }
  
  stayWithinBounds() {
    if (this.pos.x <= 0 || this.pos.x >= width) {
      this.vel.x *= -1; // Inverser la direction sur l'axe X
    }

    if (this.pos.y <= 0 || this.pos.y >= height) {
      this.vel.y *= -1; // Inverser la direction sur l'axe Y
    }
  }
  
  wander() {
    // Point devant le véhicule, centre du cercle
    let wanderPoint = this.vel.copy();
    wanderPoint.setMag(this.distanceCercle);
    wanderPoint.add(this.pos);
  
    if (Vehicle.debug) {
      // on le dessine sous la forme d'une petit cercle rouge
      fill(255, 0, 0);
      noStroke();
      circle(wanderPoint.x, wanderPoint.y, 8);

      // Cercle autour du point
      noFill();
      stroke(255);
      circle(wanderPoint.x, wanderPoint.y, this.wanderRadius * 2);

      // on dessine une ligne qui relie le vaisseau à ce point
      // c'est la ligne blanche en face du vaisseau
      line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
    }
  
    // Calcul du point sur le cercle (cercle vert)
    let theta = this.wanderTheta + this.vel.heading();
    let x = this.wanderRadius * cos(theta);
    let y = this.wanderRadius * sin(theta);
    wanderPoint.add(x, y);
  
    if (Vehicle.debug) {
      // on le dessine sous la forme d'un cercle vert
      fill(0, 255, 0);
      noStroke();
      circle(wanderPoint.x, wanderPoint.y, 16);

      // on dessine le vecteur desiredSpeed qui va du vaisseau au point vert
      stroke(255);
      line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
    }
    // Calcul et application de la force
    let steer = wanderPoint.sub(this.pos);
    steer.setMag(this.maxForce);
    this.applyForce(steer);
  
    // Variation aléatoire de l'angle
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);
  }
  
  // on fait une méthode applyBehaviors qui applique les comportements
  // seek et avoid
  applyBehaviors(target, obstacles) {
    if (wander_comportement) {
      this.wander(); // Appliquer le comportement wander si activé
    }
    let seekForce = this.arrive(target);
    let avoidForce = this.avoid(obstacles);
    let separateForce = this.separate(vehicules);

    seekForce.mult(0.2);
    avoidForce.mult(3);
    separateForce.mult(0.3);

    this.applyForce(seekForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
  }

  avoid(obstacles) {
    // TODO
    // calcul d'un vecteur ahead devant le véhicule
    // il regarde par exemple 50 frames devant lui
    let ahead = this.vel.copy();
    ahead.mult(50);
    // Calcul de ahead2 situé au milieu de ahead
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    if(Vehicle.debug) {
    // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
    this.drawVector(this.pos, ahead, "yellow");
    // on dessine le vecteur ahead2 en bleu
    this.drawVector(this.pos, ahead2, "blue");
    }

    // Calcul des coordonnées du point au bout de ahead
    let pointAuBoutDeAhead = this.pos.copy().add(ahead);
    // Calcul des coordonnées du point au bout de ahead2
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);


    // Detection de l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si pas d'obstacle, on renvoie un vecteur nul
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // On calcule la distance entre l'obstacle le plus proche 
    // et le bout du vecteur ahead
    let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    // idem avec ahead2
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    // idem avec la position du véhicule
    let distance3 = this.pos.dist(obstacleLePlusProche.pos);


    if(Vehicle.debug) {
    // On dessine avec un cercle le point au bout du vecteur ahead pour debugger
    fill(255, 0, 0);
    circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
    // et un au bout de ahead2
    fill(0, 255, 0);
    circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

    // On dessine la zone d'évitement
    // Pour cela on trace une ligne large qui va de la position du vaisseau
    // jusqu'au point au bout de ahead
    stroke(100, 100);
    strokeWeight(this.largeurZoneEvitementDevantVaisseau);
    line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
    }

    // Calcul de la plus petite distance entre distance et distance2
    distance = min(distance, distance2);
    // calcul de la plus petite distance entre distance et distance3
    distance = min(distance, distance3);

    // si la distance est < rayon de l'obstacle
    // il y a collision possible et on dessine l'obstacle en rouge
    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {

      if(this.pos.dist(obstacleLePlusProche.pos) < (this.r + obstacleLePlusProche.r)) {
        // il y a VRAIMENT collision, on dessine l'obstacle en rouge
        //obstacleLePlusProche.color = "red";
      } else {
        //obstacleLePlusProche.color = "green";
      }

      // calcul de la force d'évitement. C'est un vecteur qui va
      // du centre de l'obstacle vers le point au bout du vecteur ahead
      // on va appliquer force = vitesseDesiree - vitesseActuelle
      let desiredVelocity;
      if(distance == distance2) {
         desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      } else if(distance == distance3) {
          desiredVelocity = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
      } else {
          desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      }

      if(Vehicle.debug) {
        // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
        this.drawVector(obstacleLePlusProche.pos, desiredVelocity, "yellow");
      }
      // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
      // on limite ce vecteur desiredVelocity à  maxSpeed
      desiredVelocity.setMag(this.maxSpeed);

      // on calcule la force à appliquer pour atteindre la cible avec la formule
      // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
      let force = p5.Vector.sub(desiredVelocity, this.vel);

      // on limite cette force à la longueur maxForce
      force.limit(this.maxForce);

      return force;
    } else {
      //obstacleLePlusProche.color = "green";
      return createVector(0, 0);
    }

  }

  avoidCorrige(obstacles) {
    // calcul d'un vecteur ahead devant le véhicule
    // il regarde par exemple 50 frames devant lui
    let ahead = this.vel.copy();
    ahead.mult(30);
    //on calcue ahead2 deux fois plus petit
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
    this.drawVector(this.pos, ahead, "yellow");

    // Calcul des coordonnées du point au bout de ahead
    let pointAuBoutDeAhead = this.pos.copy().add(ahead);
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

    // Detection de l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si pas d'obstacle, on renvoie un vecteur nul
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // On calcule la distance entre le cercle et le bout du vecteur ahead
    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    let distance = min(distance1, distance2);


    // On dessine le point au bout du vecteur ahead pour debugger
    fill("red");
    circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
    fill("blue");
    circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

    // On dessine la zone d'évitement
    // Pour cela on trace une ligne large qui va de la position du vaisseau
    // jusqu'au point au bout de ahead
    stroke(100, 100);
    strokeWeight(this.largeurZoneEvitementDevantVaisseau);
    line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);

    // si la distance est < rayon de l'obstacle
    // il y a collision possible et on dessine l'obstacle en rouge

    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
      // collision possible 

      // calcul de la force d'évitement. C'est un vecteur qui va
      // du centre de l'obstacle vers le point au bout du vecteur ahead
      let force;
      if (distance1 < distance2) {
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      }
      else {
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      }
      // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
      this.drawVector(obstacleLePlusProche.pos, force, "yellow");

      // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
      // on limite ce vecteur à la longueur maxSpeed
      // force est la vitesse désirée
      force.setMag(this.maxSpeed);
      // on calcule la force à appliquer pour atteindre la cible avec la formule
      // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
      force.sub(this.vel);
      // on limite cette force à la longueur maxForce
      force.limit(this.maxForce);
      return force;
    } else {
      // pas de collision possible
      return createVector(0, 0);
    }
  }


  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      // Je calcule la distance entre le vaisseau et l'obstacle
      const distance = this.pos.dist(o.pos);

      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;
  }

  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche;

    vehicules.forEach(v => {
      if (v != this) {
        // Je calcule la distance entre le vaisseau et le vehicule
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    });

    return vehiculeLePlusProche;
  }


  getClosestObstacle(pos, obstacles) {
    // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
    let closestObstacle = null;
    let closestDistance = 1000000000;
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (closestObstacle == null || distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    return closestObstacle;
  }

  arrive(target) {
    // 2nd argument true enables the arrival behavior
    return this.seek(target, true);
  }

  seek(target, arrival = false) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    }
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // inverse de seek !
  flee(target) {
    return this.seek(target).mult(-1);
  }

  /* Poursuite d'un point devant la target !
     cette methode renvoie la force à appliquer au véhicule
  */
  pursue(vehicle) {
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10);
    target.add(prediction);
    fill(0, 255, 0);
    circle(target.x, target.y, 16);
    return this.seek(target);
  }

  evade(vehicle) {
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1);
    return pursuit;
  }

  // Comportement Separation : on garde ses distances par rapport aux voisins
  // ON ETUDIERA CE COMPORTEMENT PLUS TARD !
  separate(boids) {
    let desiredseparation = this.r;
    let steer = createVector(0, 0, 0);
    let count = 0;
    // On examine les autres boids pour voir s'ils sont trop près
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      // Si la distance est supérieure à 0 et inférieure à une valeur arbitraire (0 quand on est soi-même)
      if (d > 0 && d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // poids en fonction de la distance. Plus le voisin est proche, plus le poids est grand
        steer.add(diff);
        count++; // On compte le nombre de voisins
      }
    }
    // On moyenne le vecteur steer en fonction du nombre de voisins
    if (count > 0) {
      steer.div(count);
    }

    // si la force de répulsion est supérieure à 0
    if (steer.mag() > 0) {
      // On implemente : Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  // en fait on additionne le vecteurr force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // on ajoute l'accélération à la vitesse. L'accélération est un incrément de vitesse
    // (accélératiion = dérivée de la vitesse)
    this.vel.add(this.acc);
    // on contraint la vitesse à la valeur maxSpeed
    this.vel.limit(this.maxSpeed);
    // on ajoute la vitesse à la position. La vitesse est un incrément de position, 
    // (la vitesse est la dérivée de la position)
    this.pos.add(this.vel);

    // on remet l'accélération à zéro
    this.acc.set(0, 0);

    // mise à jour du path (la trainée derrière)
    this.ajoutePosAuPath();

    // durée de vie
    this.dureeDeVie -= 0.01;
    this.stayWithinBounds();
  }

  ajoutePosAuPath() {
    // on rajoute la position courante dans le tableau
    this.path.push(this.pos.copy());

    // si le tableau a plus de 50 éléments, on vire le plus ancien
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  // On dessine le véhicule, le chemin etc.
  show() {
    // Affichage du chemin (path)
    this.drawPath();

    // Affichage de l'image du véhicule
    push();
    translate(this.pos.x, this.pos.y); // Place l'image à la position du véhicule
    rotate(this.vel.heading() - PI / 2); // Oriente l'image selon la direction
    imageMode(CENTER);
    image(this.image, 0, 0, this.r * 2 * 0.5, this.r * 2 * 0.8); // Taille réduite à 50%
    pop();
  }
 

  drawPath() {
    push();
    stroke(255);
    noFill();
    strokeWeight(1);

    fill(this.color);
    // dessin du chemin
    this.path.forEach((p, index) => {
      if (!(index % 5)) {

        circle(p.x, p.y, 1);
      }
    });
    pop();
  }
  drawVector(pos, v, color) {
    push();
    // Dessin du vecteur vitesse
    // Il part du centre du véhicule et va dans la direction du vecteur vitesse
    strokeWeight(3);
    stroke(color);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    // dessine une petite fleche au bout du vecteur vitesse
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  // que fait cette méthode ?
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(5);
  }

  show() {
    
    stroke(255);
    strokeWeight(3);
    fill("#F063A4");
    push();
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    pop();
    pop();
  }
}