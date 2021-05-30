function genIslands(config) {

	var colorPalette = {
		shallow: 'rgb(52, 235, 229)',
		mShallow: 'rgb(52, 177, 235)',
		deepWater: 'rgb(51, 153, 255)',
		river: 'rgb(52,200,229)',
		red: 'rgb(200,30,30)'
	}

	//Basic world shape
	var world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
			var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
			this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 5 || (surrounding>=3 && getChance(8, 1));
			if (world.iteration===15&&surrounding<4) this.open = false; 
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

	for (i=0; i<16; i++) {
		world.step();
		world.iteration++;
	}

	var grid = world.createGridFromValues([
		{ cellType: 'wall', hasProperty: 'open', value: 1 }
	], 0);

	//Details
	world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0
	});

	world.registerCellType('water', {
		getColor: function () {
			if (this.shallow) return colorPalette.shallow;
			else if (this.mediumShallow) return colorPalette.mShallow;
			else if (this.deepWater) return colorPalette.deepWater;
		},
		process: function (neighbors) {
			this.mediumShallow = !this.shallow && this.countSurroundingCellsWithValue(neighbors, "shallow")>0 || this.countSurroundingCellsWithValue(neighbors, 'island')>2;
			this.shallow = this.countSurroundingCellsWithValue(neighbors, "beach")>1;
			this.deepWater = !this.shallow&&!this.mediumShallow&&!this.waterDecoration;
			this.waterDecoration = this.countSurroundingCellsWithValue(neighbors, 'deepWater')==8&&getChance(80, 1)&&world.iteration==29;
		}
	}, function () {
		this.water = true;
	});

	world.registerCellType('island', {
		isSolid: true,
		getColor: function()
		{
			if(this.beach) return 'rgb(255, 255, 153)';
			else if (this.river) return colorPalette.river;
			else {
				var v = Math.floor(Math.random()*17);
				var g = (140+v).toString();
				return 'rgb(34,'+g+',50)';
			}
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
			if ((world.iteration==1&&getChance(16,1*config.rivers)&&this.countSurroundingCellsWithValue(neighbors, 'mountain')==1)&&this.countSurroundingCellsWithValue(neighbors, 'river')==0
			&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;
				}
			}
			else if ((this.terrain||this.beach||this.forest)&&this.countSurroundingCellsWithValue(neighbors, 'river')==1) {
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i) 	{ 
						this.river = true;
						this.forest = false;
						this.beach = false;
						this.changedDirection = false;
					}
				}
			}

			//city generation
			if ((this.terrain||this.forest)&&this.countSurroundingCellsWithValue(neighbors, 'river')>1&&!this.countSurroundingCellsWithValue(neighbors, 'mountain')&&getChance(64,1*config.cities)&&world.iteration>28
			&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
					this.city=true;
			}
			if ((this.terrain||this.beach)&&this.countSurroundingCellsWithValue(neighbors, 'water')>2&&this.countSurroundingCellsWithValue(neighbors, 'water')<5&&getChance(80,1*config.cities)&&world.iteration>28
			&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
				this.city=true;
			}

			//forest generation
			this.forest = (this.forest&&this.countSurroundingCellsWithValue(neighbors, 'water')<2)||
				(!this.mountain&&!this.river&&getChance(24,1*config.forests)&&this.countSurroundingCellsWithValue(neighbors, 'water')<2&&this.countSurroundingCellsWithValue(neighbors, 'forest')>=1);

			//beach generation
			this.beach = (this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 
				&& this.countSurroundingCellsWithValue(neighbors, 'terrain')>1)||(this.beach&&this.countSurroundingCellsWithValue(neighbors, 'river')>1)
				||(this.terrain&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1&&this.countSurroundingCellsWithValue(neighbors, 'water')>3)

			//terrain generation
			this.terrain = !this.mountain&&!this.cliff&&!this.river&&!this.city&&!this.forest;
			
			//mountain generation
			this.mountain = (this.mountain&&!this.countSurroundingCellsWithValue(neighbors, 'water'))||
				(world.iteration<4&&getChance(12,1*config.mountains)&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')&&this.countSurroundingCellsWithValue(neighbors, 'mountain')>=1);

			//cliff generation
			//this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

	}, function () {
		this.island = true;
		if (config.beaches!=0) this.beach = Math.random() > 0.2-config.beaches*0.2;
		if (config.mountains!=0) this.mountain = Math.random() > 1-config.mountains*0.01;
		if (config.forests!=0) this.forest = Math.random() > 1-config.forests*0.01;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	initializeWorld(world);
};
