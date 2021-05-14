function initializeWorld(world) {
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	const btnGen = document.querySelector(".btn-generate");

	btnGen.disabled=true;
	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;

	for (let i=0;i<5;i++) {
		setTimeout(function(){
			world.step();
			draw(world,ctx, i);
			if (i==4) btnGen.disabled=false;
		},i*200);
	}
}


//drawing on canvas
function draw(world, ctx, iteration) {
	//array that stores map elements which are bigger than 8x8px (mountains, cities etc.)
	var bigElements = [];

	//go over whole world, draw 8x8px elements and push 16x16px elements into the array
	for (y=0;y<world.height;y++) {
		for (x=0;x<world.width;x++) {
			if (world.grid[y][x].getSprite()) {
				//if element is 16x16px push it into the array
				if (world.grid[y][x].getSize()===16) {
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

	//draw 16x16px elements
	if (iteration==4) bigElements.forEach(element=> {
		ctx.drawImage(element[0].getSprite(),element[2]*world.cellSize-12,element[1]*world.cellSize-12,24,24);
	});
}