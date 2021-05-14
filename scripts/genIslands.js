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
			const chance = Math.floor(Math.random()*8);
			this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 5 || (surrounding>=3 && chance==7);
		},
		reset: function () {
			this.wasOpen = this.open;
		}
	}, function () {
		this.open = Math.random() > 0.55;
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
			this.beach = this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 
				&& this.countSurroundingCellsWithValue(neighbors, 'terrain')>1;

			this.terrain = !this.beach&&!this.mountain&&!this.cliff;
			
			this.mountain = (this.countSurroundingCellsWithValue(neighbors, 'terrain')==8||(this.countSurroundingCellsWithValue(neighbors, 'mountain')==1

				&&this.countSurroundingCellsWithValue(neighbors, 'terrain')==7))&&this.mountain;
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

	initializeWorld(world);
};