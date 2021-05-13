function genIslands() {

	//Basic world shape
	var world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
			var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
			this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 5;
		},
		reset: function () {
			this.wasOpen = this.open;
		}
	}, function () {
		this.open = Math.random() > 0.5;
	});

	world.initialize([
		{ name: 'wall', distribution: 100 }
	]);

	for (i=0; i<10; i++) {
		world.step();
	}

	var grid = world.createGridFromValues([
		{ cellType: 'wall', hasProperty: 'open', value: 1 }
	], 0);





	//Details
	world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8
	});

	world.registerCellType('water', {
		getSize: function () {
			return 8;
		},
		getSprite: function () {
			return false;
		},
		getColor: function () {
			if (this.shallow) return 'rgb(52, 235, 229)';
			else if (this.mediumShallow) return 'rgb(52, 177, 235)'
			else return 'rgb(51, 153, 255)';
		},
		process: function (neighbors) {
			this.shallow = this.countSurroundingCellsWithValue(neighbors, "beach")>1;
			this.mediumShallow = !this.shallow && this.countSurroundingCellsWithValue(neighbors, "shallow")>0 || this.countSurroundingCellsWithValue(neighbors, 'terrain')>1;
		}
	}, function () {
		this.water = true;
	});

	world.registerCellType('island', {
		isSolid: true,
		getSize: function () {
			if (this.mountain) return 16;
			else return 8;
		},
		getSprite: function () {
			if (this.mountain) {
				const sprite = new Image();
        		sprite.src = "images/mountains.png";
				return sprite;
			}
			else return false;
		},
		getColor: function()
		{
			if(this.beach) return 'rgb(255, 255, 153)';
			else if (this.terrain) {
				var v = Math.floor(Math.random()*25);
				var g = (140+v).toString();
				return 'rgb(34,'+g+',50)';
			}
			else if (this.mountain) return 'rgb(186,186,186)';
			else if (this.cliff) return 'rgb(186,186,186)';

		},
		process: function(neighbors) {
			this.beach = this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 && this.countSurroundingCellsWithValue(neighbors, 'terrain')>1;
			this.terrain = !this.beach&&!this.mountain&&!this.cliff;
			this.mountain = this.countSurroundingCellsWithValue(neighbors, 'terrain')==8&&this.mountain;
			this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}
	}, function () {
		this.beach = Math.random() > 0.2;
		this.terrain = Math.random() > 0.1;
		this.mountain = Math.random() > 0.9;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	return world;
};

function drawMyIslands() {
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	const btnGen = document.querySelector(".btn-generate");

	var world = genIslands(world, ctx);

	btnGen.disabled=true;
	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;

	for (let i=0;i<5;i++) {
		setTimeout(function(){
			world.step();
			draw(world,ctx, i);
			if (i==4) btnGen.disabled=false;
		},i*150);
	}
}

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