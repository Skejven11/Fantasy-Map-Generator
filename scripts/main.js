function initializeWorld(world) {
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	const btnGen = document.querySelector(".btn-generate");

	btnGen.disabled=true;
	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;

	for (let i=0;i<30;i++) {
		setTimeout(function(){
			world.step();
			world.iteration++;
			draw(world,ctx, i);
			if (i==29) btnGen.disabled=false;
		},i*60);
	}
}


//drawing on canvas
function draw(world, ctx, iteration) {
	//arrays that store map elements which are bigger than 8x8px (mountains, cities etc.)
	let cities = [];
	let forests = [];
	let mountains = [];

	//loading spirte once instead of every cell
	const mountainSprite = new Image();
    mountainSprite.src = "images/mountains.png";
	const citySprite = new Image();
    citySprite.src = "images/city.png";
	const forestSprite = new Image();
    forestSprite.src = "images/forest.png";

	//go over whole world, draw 8x8px elements and push 16x16px elements into the array
	for (y=0;y<world.height;y++) {
		for (x=0;x<world.width;x++) {
			if (world.grid[y][x].terrain&&iteration>0) {
			}
			else {
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
				else {
					ctx.fillStyle = world.grid[y][x].getColor();
					ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
				}
			}
		}
	}

	//bigger element rendering priority
	forests.forEach(element=> {
		ctx.drawImage(forestSprite,element[2]*world.cellSize-2,element[1]*world.cellSize-2,element[0].getSize(),element[0].getSize());
	});
	mountains.forEach(element=> {
		ctx.drawImage(mountainSprite,element[2]*world.cellSize-8,element[1]*world.cellSize-10,element[0].getSize(),element[0].getSize());
	});
	cities.forEach(element=> {
		ctx.drawImage(citySprite,element[2]*world.cellSize-8,element[1]*world.cellSize-8,element[0].getSize(),element[0].getSize());
	});
}

//small function for probability of cell stuff
function getChance(max, isLower) {
	let value = Math.floor(Math.random()*max);
	if (value>=isLower) return false;
	else return true;
}