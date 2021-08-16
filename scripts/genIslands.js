function genIslands(config) {

	var riverId = 0;
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

	//World details
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
			if (config.wDecorations) this.waterDecoration = this.countSurroundingCellsWithValue(neighbors, 'deepWater')==8&&getChance(80, 1)&&world.iteration==29;
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
			else if (this.riverFill) return colorPalette.river;
			else {
				var v = Math.floor(Math.random()*17);
				var g = (140+v).toString();
				return 'rgb(34,'+g+',50)';
			}
		},

		process: function(neighbors) {

			//------------------river generation-------------------

			//Might be better algorithm idk
			/*if (this.river) {
				if (neighbors[this.riverSource]&&this.delayCell!=world.iteration) {
					if (getChance(2,1)&&this.changedDirection==false) {
						if (getChance(2,1)) {
							this.riverSource++;
							this.changedDirection = true;
						}
						else {
							this.riverSource--;
							this.changedDirection = true;
						}
					}
					if (this.riverSource>3&&neighbors[this.riverSource-4]) {
						neighbors[this.riverSource-4].river = true;
						neighbors[this.riverSource-4].beach = false;
						neighbors[this.riverSource-4].forest = false;
						neighbors[this.riverSource-4].changedDirection = false;
						neighbors[this.riverSource-4].riverSource = this.riverSource;
						if (neighbors[this.riverSource-4].delayCell===undefined) neighbors[this.riverSource-4].delayCell = world.iteration;
					}
					else if (this.riverSource<3&&neighbors[this.riverSource+4]) {
						neighbors[this.riverSource+4].river = true;
						neighbors[this.riverSource+4].beach = false;
						neighbors[this.riverSource+4].forest = false;
						neighbors[this.riverSource+4].changedDirection = false;
						neighbors[this.riverSource+4].riverSource = this.riverSource;
						if (neighbors[this.riverSource+4].delayCell===undefined) neighbors[this.riverSource+4].delayCell = world.iteration;
					}
				}
			}

			if ((world.iteration==1&&getChance(16,1*config.rivers)&&this.countSurroundingCellsWithValue(neighbors, 'mountain')==1)&&this.countSurroundingCellsWithValue(neighbors, 'river')==0
			&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')) {
				this.river = true;
				this.changedDirection = false;
				this.delayCell = world.iteration;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
				}
			}
			*/
			
			//changing direction of rivers
			if (this.river) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;

					var  add = 0;
					if (this.riverSource==7||this.riverSource==4||this.riverSource==2) var add=4;

					if (this.countSurroundingCellsWithValue(neighbors, 'water')>1) this.riverSource = false;
					else if (getChance(10,1*config.rivers+add)&&!this.createdRiver) {
						if (getChance(2,1)) {
							this.riverSource++;
						}
						else {
							this.riverSource--;
						}
					}
				}
				
			}
			//generating first river cells
			if ((world.iteration==1&&getChance(16,1*config.rivers)&&this.countSurroundingCellsWithValue(neighbors, 'mountain')==1)&&this.countSurroundingCellsWithValue(neighbors, 'river')==0
			&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;
				}
			}
			//generating next river cells
			else if ((this.terrain||this.beach||this.forest)&&this.countSurroundingCellsWithValue(neighbors, 'river')==1) {
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i) 	{ 
						this.river = true;
						this.forest = false;
						this.beach = false;
						if (!config.sprawlingRivers) neighbors[i].createdRiver = true;
					}
				}
			}


			

			//-------------------city generation-------------------
			if ((this.terrain||this.forest)&&this.countSurroundingCellsWithValue(neighbors, 'river')>1&&!this.countSurroundingCellsWithValue(neighbors, 'mountain')&&getChance(64,1*config.cities)&&world.iteration>28
			&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
					this.city=true;
			}
			if ((this.terrain||this.beach)&&this.countSurroundingCellsWithValue(neighbors, 'water')>2&&this.countSurroundingCellsWithValue(neighbors, 'water')<5&&getChance(80,1*config.cities)&&world.iteration>28
			&&this.countSurroundingCellsWithValue(neighbors, 'city')==0) {
				this.city=true;
			}

			//-------------------forest generation-------------------
			this.forest = (this.forest&&this.countSurroundingCellsWithValue(neighbors, 'water')<2)||
				(!this.mountain&&!this.river&&getChance(24,1*config.forests)&&this.countSurroundingCellsWithValue(neighbors, 'water')<2&&this.countSurroundingCellsWithValue(neighbors, 'forest')>=1);

			//-------------------beach generation-------------------
			this.beach = (this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 
				&& this.countSurroundingCellsWithValue(neighbors, 'terrain')>1)||(this.beach&&this.countSurroundingCellsWithValue(neighbors, 'river')>1)
				||(this.terrain&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1&&this.countSurroundingCellsWithValue(neighbors, 'water')>3)
			//applying proper sprite from the spritesheat
			if (this.beach) {
				if (neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null) {
					if (neighbors[1].water&&(neighbors[3].beach||neighbors[3].terrain)&&(neighbors[4].beach||neighbors[4].terrain)) this.spriteNr = 0;
					else if (neighbors[6].water&&(neighbors[3].beach||neighbors[3].terrain)&&(neighbors[4].beach||neighbors[4].terrain)) this.spriteNr = 1;
					else if (neighbors[3].water&&(neighbors[1].beach||neighbors[1].terrain)&&(neighbors[6].beach||neighbors[6].terrain)) this.spriteNr = 2;
					else if (neighbors[4].water&&(neighbors[1].beach||neighbors[1].terrain)&&(neighbors[6].beach||neighbors[6].terrain)) this.spriteNr = 3;
					else if (neighbors[1].water&&neighbors[4].water) this.spriteNr = 4;
					else if (neighbors[1].water&&neighbors[3].water) this.spriteNr = 5;
					else if (neighbors[6].water&&neighbors[3].water) this.spriteNr = 6;
					else if (neighbors[6].water&&neighbors[4].water) this.spriteNr = 7;
				}
				else this.spriteNr = 20;
			}

			//-------------------terrain generation-------------------
			this.terrain = !this.mountain&&!this.cliff&&!this.river&&!this.city&&!this.forest&&!this.riverFill&&!this.beach;
			//applying proper sprite from the spritesheat
			if (this.terrain) {
				if (neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null) {
					if (neighbors[1].beach&&neighbors[4].beach) this.spriteNr = 0;
					else if (neighbors[1].beach&&neighbors[3].beach) this.spriteNr = 1;
					else if (neighbors[6].beach&&neighbors[4].beach) this.spriteNr = 2;
					else if (neighbors[6].beach&&neighbors[3].beach) this.spriteNr = 3;
					else this.spriteNr = 4;
				}
			}

			//-------------------mountain generation-------------------
			if ((world.iteration<4&&getChance(12,1*config.mountains)&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')&&this.countSurroundingCellsWithValue(neighbors, 'mountain')>=1)) {
				this.mountain = true;
				if (getChance(3,1)) this.mountainSize = 22;
				else this.mountainSize = 30;
				return;
			}
			if (this.mountain&&!this.countSurroundingCellsWithValue(neighbors, 'water')) this.mountain = true;

			//cliff generation
			//this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

		//generate proper cells on first world creation
	}, function () {
		this.island = true;
		if (config.beaches!=0) this.beach = Math.random() > 0.2-config.beaches*0.2;
		if (config.mountains!=0&&Math.random() > 1-config.mountains*0.01) {
			this.mountain = true;
			if (getChance(3,1)) this.mountainSize = 18;
			else this.mountainSize = 24;
		}
		if (config.forests!=0) this.forest = Math.random() > 1-config.forests*0.01;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	initializeWorld(world);
};



/*
0 lewa góra
1 góra
2
3 lewo
4 prawo
5
6 dół
7
*/