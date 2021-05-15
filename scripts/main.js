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
	//array that stores map elements which are bigger than 8x8px (mountains, cities etc.)
	var bigElements = [];

	//go over whole world, draw 8x8px elements and push 16x16px elements into the array
	for (y=0;y<world.height;y++) {
		for (x=0;x<world.width;x++) {
			if (world.grid[y][x].terrain&&iteration>0) {
			}
			else {
				if (world.grid[y][x].getSprite()) {
					//if element is 16x16px push it into the array
					if (world.grid[y][x].getSize()!==8) {
						bigElements.push([world.grid[y][x],y,x]);
					}
					//if not just draw the sprite
					else {
						ctx.drawImage(world.grid[y][x].getSprite(),x*world.cellSize,y*world.cellSize,8,8);
					}
				}
				else {
					ctx.fillStyle = world.grid[y][x].getColor();
					ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
				}
			}
		}
	}

	//draw 16x16px elements
		bigElements.forEach(element=> {
		ctx.drawImage(element[0].getSprite(),element[2]*world.cellSize-8,element[1]*world.cellSize-10,element[0].getSize(),element[0].getSize());
	});
}

//small function for probability of cell stuff
function getChance(max, isLower) {
	let value = Math.floor(Math.random()*max);
	if (value>=isLower) return false;
	else return true;
}