function genIsland() {

	var world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
			var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
			this.open = (this.wasOpen && surrounding >= 2) || surrounding >= 3;
		},
		reset: function () {
			this.wasOpen = this.open;
		}
	}, function () {
		this.open = Math.random() > 0.9;
	});

	world.initialize([
		{ name: 'wall', distribution: 100 }
	]);

	for (var i=0; i<10; i++) {
		world.step();
	}

	var grid = world.createGridFromValues([
		{ cellType: 'wall', hasProperty: 'open', value: 1 }
	], 0);

	world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8
	});

	world.registerCellType('water', {
		getColor: function () {
			if (this.shallow) return 'rgb(52, 235, 229)';
			else if (this.mediumShallow) return 'rgb(52, 177, 235)'
			else return 'rgb(51, 153, 255)';;
		},
		process: function (neighbors) {
			this.shallow = this.countSurroundingCellsWithValue(neighbors, "beach")>1;
			this.mediumShallow = !this.shallow && this.countSurroundingCellsWithValue(neighbors, "shallow")>0;
		},
	}, function () {
		this.water = true;
	});

	world.registerCellType('island', {
		isSolid: true,
		getColor: function()
		{
			if(this.beach) return 'rgb(255, 255, 153)';
			else
				var v = this.foliage;
			var r = (Math.floor(109 - 55 * v)).toString();
			var g = (Math.floor(180 + 55 * v)).toString();
			var b = (Math.floor(84 + 55 * v)).toString();
			return 'rgb('+r+', '+g+', '+b+', 1)';
		},
		process: function(neighbors) {
			this.beach = this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0;
			this.floodedness = this.getSurroundingCellsAverageValue(neighbors, 'value');
		}
	}, function () {
		this.beach = Math.random() > 0.2;
		this.foliage = -0.5 + Math.random();
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	return world;
};

function drawMyIsland() {
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext('2d');
	let tree = document.getElementById("tree");

	var world = genIsland();

	canvas.width  = world.width*world.cellSize;
	canvas.height = world.height*world.cellSize;
	for (i=0;i<3;i++) {
		setTimeout(draw(world, ctx),500);
		world.step();
	}
}

function draw(world, ctx) {
	for (y=0;y<world.height;y++) {
		for (x=0;x<world.width;x++) {

			ctx.fillStyle = world.grid[y][x].getColor();
			ctx.fillRect(x*world.cellSize,y*world.cellSize,world.cellSize,world.cellSize);
			
		}
	}
}