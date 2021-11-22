var worldGlobal = null;
function initializeWorld(world) {
	const canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	const btnGen = document.querySelector(".btn-generate");
	const btnSave = document.querySelector(".btn-save");
	const gear = document.querySelector(".loading-gear");
	const btnMenu = document.querySelector(".menu-button");
    const menu = document.querySelector(".user-menu");

	gear.style.visibility = "visible";
	gear.style.animation = "1.5s infinite ease-in-out rotate";
	menu.classList.remove("user-menu-active");
    btnMenu.classList.remove("menu-button-active");
	btnMenu.disabled=true;
	btnGen.disabled=true;
	btnSave.disabled=true;
	
	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;
	
	for (let i=0;i<30;i++) {
		setTimeout(function(){
			world.step();
			world.iteration++;
			if (world.iteration>1) draw(world, ctx, canvas)
			if (i==29) {
				menu.classList.add("user-menu-active");
    			btnMenu.classList.add("menu-button-active");
				btnMenu.disabled=false;
				btnGen.disabled=false;
				btnSave.disabled=false;
				gear.style.visibility = "hidden";
				gear.style.animation = "";
			}
		},i*75);
	}
	worldGlobal = world;
	if (canvas.getAttribute('data-click-listener') !== 'true') { 
		canvas.setAttribute('data-click-listener', true);
		canvas.addEventListener('click', event=>{
			getMousePos(canvas, event);
		});
	}
}


//drawing on canvas
function draw(world, ctx, canvas) {
	ctx.clearRect(0,0,canvas.width, canvas.height);
	//arrays that store map elements which are bigger than 8x8px (mountains, cities etc.)
	let cities = [];
	let forests = [];
	let mountains = [];
	let wDecorations = [];
	let lDecorations = [];

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
			ctx.fillStyle = world.grid[y][x].getColor();
			ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);

			switch (true) {
				case world.grid[y][x].city:
					cities.push([world.grid[y][x],y,x]);
					break;

				case world.grid[y][x].forest:
					forests.push([world.grid[y][x],y,x]);
					break;

				case world.grid[y][x].mountain:
					mountains.push([world.grid[y][x],y,x]);
					break;

				case world.grid[y][x].waterDecoration:
					wDecorations.push([world.grid[y][x],y,x]);
					break;

				case world.grid[y][x].landDecoration:
					lDecorations.push([world.grid[y][x],y,x]);
					break;

				case world.grid[y][x].beach:
					ctx.drawImage(spriteSheat,world.cellSize*world.grid[y][x].spriteNr,0,world.cellSize,world.cellSize,x*world.cellSize,y*world.cellSize, world.cellSize, world.cellSize);
					break;

				case world.grid[y][x].terrain&&world.grid[y][x].spriteNr!=null:
					ctx.drawImage(spriteSheat,world.cellSize*world.grid[y][x].spriteNr,10,world.cellSize,world.cellSize,x*world.cellSize,y*world.cellSize, world.cellSize, world.cellSize);
					break;

				default:
					ctx.fillStyle = world.grid[y][x].getColor();
					ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
					break;
				
			}
		}
	}

	//bigger element rendering priority
	forests.forEach(element=> {
		ctx.drawImage(element[0].Sprite,element[2]*world.cellSize-2,element[1]*world.cellSize-(element[0].Sprite.height/2));
	});
	mountains.forEach(element=> {
		ctx.drawImage(mountainSprite,element[2]*world.cellSize-8,element[1]*world.cellSize-10, element[0].mountainSize, element[0].mountainSize);
	});
	cities.forEach(element=> {
		ctx.drawImage(citySprite,element[2]*world.cellSize-(citySprite.width/2),element[1]*world.cellSize-(citySprite.height/2));
	});
	wDecorations.forEach(element=> {
		ctx.drawImage(element[0].Sprite,element[2]*world.cellSize-(element[0].Sprite.width/2),element[1]*world.cellSize-(element[0].Sprite.height/2));
	});
	lDecorations.forEach(element=>{
		ctx.drawImage(element[0].Sprite,element[2]*world.cellSize-(element[0].Sprite.width/2),element[1]*world.cellSize-(element[0].Sprite.height/2));
	})

	//draw ribbon at the bottom of the map
	if (getConfig().ribbon) drawRibbon(canvas, ctx);
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
		ribbon : document.getElementById("ribbon").checked
	}
	return config;
}

//small function for probability of cell stuff
function getChance(max, isLower) {
	let value = Math.floor(Math.random()*max);
	return value >= isLower ? false : true;
}

function getMousePos(canvas, evt) { //function used for debugging, displays clicked cell's properties
	const world = worldGlobal;
    var rect = canvas.getBoundingClientRect();
    position = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
	console.log(world.grid[Math.floor(position.y/world.cellSize)][Math.floor(position.x/world.cellSize)]);
}

function drawRibbon(canvas, ctx) { //draws ribbon and "title" of the map
	const ribbonSprite = new Image();
	ribbonSprite.src = "images/ribbon.png";
	ctx.drawImage(ribbonSprite,0,550)

	let fontSize = 90;
	let landName = getConfig().landName;
	if (landName==="") landName = "GIVE IT A NAME"
	ctx.font = fontSize+"px Fondamento";
	
	while (ctx.measureText("Land of "+landName).width>500) { //if the title doesn't fit lower font size till it fits
		fontSize--;
		ctx.font = fontSize+"px Fondamento";
	}
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.fillText("Land of "+landName,canvas.width/2, 700+fontSize/2)
}
