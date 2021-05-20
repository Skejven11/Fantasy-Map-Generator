function genIslands() {

	var colorPalette = {
		shallow: 'rgb(52, 235, 229)',
		mShallow: 'rgb(52, 177, 235)',
		deepWater: 'rgb(51, 153, 255)',
		river: 'rgb(52,200,229)',
		red: 'rgb(200,30,30)'
	}

	//Basic world shape
	var world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
			var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
			this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 5 || (surrounding>=3 && getChance(8, 1));
		},
		reset: function () {
			this.wasOpen = this.open;
		}
	}, function () {
		this.open = Math.random() > 0.535;
	});

	world.initialize([
		{ name: 'wall', distribution: 100 }
	]);

	for (i=0; i<15; i++) {
		world.step();
	}

	var grid = world.createGridFromValues([
		{ cellType: 'wall', hasProperty: 'open', value: 1 }
	], 0);

	//Details
	world = new CAWorld({
		width: 100,
		height: 100,
		cellSize: 8,
		iteration:0
	});

	world.registerCellType('water', {
		getSize: function () {
			return 8;
		},
		getSprite: function () {
			return false;
		},
		getColor: function () {
			if (this.shallow) return colorPalette.shallow;
			else if (this.mediumShallow) return colorPalette.mShallow;
			else return colorPalette.deepWater;
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
			if (this.mountain||this.city) return 24;
			else return 8;
		},
		getSprite: function () {
			if (this.mountain) {
				const sprite = new Image();
        		sprite.src = "images/mountains.png";
				return sprite;
			}
			else if (this.city) {
				const sprite = new Image();
        		sprite.src = "images/city.png";
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
			else if (this.mountain) return 'rgb(0,0,0)'
			else if (this.river) return colorPalette.river;
		},

		process: function(neighbors) {

			//river generation
			if (this.river) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;

					if (this.countSurroundingCellsWithValue(neighbors, 'water')>1) this.riverSource = false;
					else if (getChance(2,1)) {
						if (getChance(2,1)) {
							this.riverSource++;
							this.changedDirection = true;
						}
						else {
							this.riverSource--;
							this.changedDirection = true;
						}
					}
				}
				
			}
			if ((world.iteration==1&&getChance(16,1)&&this.countSurroundingCellsWithValue(neighbors, 'mountain')==1)&&this.countSurroundingCellsWithValue(neighbors, 'river')==0
			&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;
				}
			}
			else if ((this.terrain||this.beach)&&this.countSurroundingCellsWithValue(neighbors, 'river')==1) {
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i) 	{ 
						this.river = true;
						this.beach = false;
						this.changedDirection = false;
					}
				}
			}

			//city generation
			if (this.terrain&&this.countSurroundingCellsWithValue(neighbors, 'river')>1&&!this.countSurroundingCellsWithValue(neighbors, 'mountain')&&getChance(64,1)&&world.iteration>28
			&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
				for (i = 0; i<8; i++) {
					if (neighbors[i]&&neighbors[i].countSurroundingCellsWithValue(neighbors, 'city')==0) {
						this.city=true;
					}
				}
			}
			if ((this.terrain||this.beach)&&this.countSurroundingCellsWithValue(neighbors, 'water')>2&&getChance(64,1)&&world.iteration>28&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
				for (i = 0; i<8; i++) {
					if (neighbors[i]&&neighbors[i].countSurroundingCellsWithValue(neighbors, 'city')==0) this.city=true;
				}
			}

			this.beach = (this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 
				&& this.countSurroundingCellsWithValue(neighbors, 'terrain')>1)||(this.beach&&this.countSurroundingCellsWithValue(neighbors, 'river')>0);

			this.terrain = !this.beach&&!this.mountain&&!this.cliff&&!this.river&&!this.city;
			
			this.mountain = (this.mountain&&!this.countSurroundingCellsWithValue(neighbors, 'water'))||
				(world.iteration<4&&getChance(12,1)&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')&&this.countSurroundingCellsWithValue(neighbors, 'mountain')>=1);

			this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

	}, function () {
		this.beach = Math.random() > 0.2;
		this.terrain = Math.random() > 0.1;
		this.mountain = Math.random() > 0.99;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	initializeWorld(world);
};
