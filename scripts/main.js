function initializeWorld(world) {
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	const btnGen = document.querySelector(".btn-generate");
	const gear = document.querySelector(".loading-gear");

	gear.style.visibility = "visible";
	gear.style.animation = "1.5s infinite ease-in-out rotate";
	btnGen.disabled=true;
	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;
	for (let i=0;i<30;i++) {
		setTimeout(function(){
			world.step();
			world.iteration++;
			if (world.iteration>1) draw(world, ctx, canvas)
			if (i==29) {
				btnGen.disabled=false;
				gear.style.visibility = "hidden";
				gear.style.animation = "";
			}
		},i*75);
	}
	canvas.addEventListener('click', event=>{
		getMousePos(world, canvas, event);
	});
}


//drawing on canvas
function draw(world, ctx, canvas) {
	//arrays that store map elements which are bigger than 8x8px (mountains, cities etc.)
	let cities = [];
	let forests = [];
	let mountains = [];
	let wDecorations = [];

	//loading spirte once instead of every cell
	const mountainSprite = new Image();
    mountainSprite.src = "images/mountains.png";
	const citySprite = new Image();
    citySprite.src = "images/city.png";

	//loading terrain spritesheat
	const spriteSheat = new Image();
	spriteSheat.src = "images/spritesheat.png";

	//go over whole world, draw 10x10px elements and push 16x16px elements into the array
	for (y=0;y<world.height;y++) {
		for (x=0;x<world.width;x++) {
				//bigger elements to array so we can arrange their rendering time
				if (world.grid[y][x].city) {
					cities.push([world.grid[y][x],y,x]);
				}
				else if (world.grid[y][x].forest) {
					forests.push([world.grid[y][x],y,x]);
				}
				else if (world.grid[y][x].mountain) {
					mountains.push([world.grid[y][x],y,x]);
				}
				else if (world.grid[y][x].waterDecoration) {
					wDecorations.push([world.grid[y][x],y,x]);
				}
				else if (world.grid[y][x].beach) {
					if (world.grid[y][x].spriteNr!=20) ctx.drawImage(spriteSheat,world.cellSize*world.grid[y][x].spriteNr,0,world.cellSize,world.cellSize,x*world.cellSize,y*world.cellSize, world.cellSize, world.cellSize);
				}
				else if (world.grid[y][x].terrain) {
					if (world.grid[y][x].spriteNr==null&&world.iteration<4) {
						ctx.fillStyle = world.grid[y][x].getColor();
						ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
					}
					else if (world.iteration==3) {
						ctx.drawImage(spriteSheat,world.cellSize*world.grid[y][x].spriteNr,10,world.cellSize,world.cellSize,x*world.cellSize,y*world.cellSize, world.cellSize, world.cellSize);
					}
				}
				else {
					ctx.fillStyle = world.grid[y][x].getColor();
					ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
				}
			}
	}
	if (world.iteration==29) ctx.translate(0.5, 0.5);

	//bigger element rendering priority
	forests.forEach(element=> {
		ctx.drawImage(element[0].Sprite,element[2]*world.cellSize-2,element[1]*world.cellSize-2);
	});
	mountains.forEach(element=> {
		ctx.drawImage(mountainSprite,element[2]*world.cellSize-8,element[1]*world.cellSize-10, element[0].mountainSize, element[0].mountainSize);
	});
	cities.forEach(element=> {
		ctx.drawImage(citySprite,element[2]*world.cellSize-8,element[1]*world.cellSize-12);
	});
	wDecorations.forEach(element=> {
		ctx.drawImage(element[0].Sprite,element[2]*world.cellSize-(element[0].Sprite.width/2),element[1]*world.cellSize-(element[0].Sprite.height/2));
	});

	//draw ribbon at the bottom of the map
	drawRibbon(canvas, ctx);
}

function getConfig() {
	let config = {
		landName : document.getElementById("landName").value,
		genType : document.getElementById("genSelection").value,
		rivers : document.getElementById("rivers").value,
		mountains : document.getElementById("mountains").value,
		cities : document.getElementById("cities").value,
		forests : document.getElementById("forests").value,
		beaches : document.getElementById("beaches").value,
		sprawlingRivers : document.getElementById("sprawlingRivers").checked,
		wDecorations : document.getElementById("wDecorations").checked,
		lDecorations : document.getElementById("lDecorations").checked,
	}
	return config;
}

//small function for probability of cell stuff
function getChance(max, isLower) {
	let value = Math.floor(Math.random()*max);
	if (value>=isLower) return false;
	else return true;
}

function getMousePos(world, canvas, evt) { //function used for debugging, displays clicked cell's properties
    var rect = canvas.getBoundingClientRect();
	var ctx = canvas.getContext('2d');
    position = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
	console.clear();
	console.log(world.grid[Math.floor(position.y/10)][Math.floor(position.x/10)]);
}

function drawRibbon(canvas, ctx) {
	const ribbonSprite = new Image();
	ribbonSprite.src = "images/ribbon.png";
	let fontSize = 90;
	const landName = getConfig().landName;

	ctx.drawImage(ribbonSprite,0,550)

	ctx.font = fontSize+"px Fondamento";
	while (ctx.measureText("Land of "+landName).width>500) {
		fontSize--;
		ctx.font = fontSize+"px Fondamento";
	}
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.fillText("Land of "+landName,canvas.width/2, 700+fontSize/2)
}

