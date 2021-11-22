function genContinental(config) {

	var riverId = 0;
	var colorPalette = {
		shallow: 'rgb(52, 235, 229)',
		mShallow: 'rgb(52, 177, 235)',
		deepWater: 'rgb(51, 153, 255)',
		river: 'rgb(50,160,250)',
		red: 'rgb(200,30,30)'
	}

	//------------------------Basic world shape------------------------
	var world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0,
		continentDirection: Math.floor(Math.random()*4)
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
			var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
			this.open = (this.wasOpen && surrounding >= 3) || surrounding >= 5 || (surrounding>=3 && getChance(8, 1));
			if (world.iteration===19&&surrounding<4) this.open = false; 
			switch (world.continentDirection) {
				case 0:
					world.grid[0][0].open = true;
					break;
				case 1:
					world.grid[0][79].open = true;
					break;
				case 2:
					world.grid[79][79].open = true;
					break;
				case 3:
					world.grid[79][0].open = true;
					break;
			}
		},
		reset: function () {
			this.wasOpen = this.open;
		}
	}, function () {
		switch (world.continentDirection) {
			case 0:
				if ((this.x<40&&this.y<5)||(this.x<5&&this.y<40)) this.open = true;
				else if (this.x<60&&this.y<60) this.open = Math.random() > 0.55;
				else this.open = Math.random() > 0.75;
				break;
			case 1:
				if ((this.x>40&&this.y<5)||(this.x>75&&this.y<40)) this.open = true;
				else if (this.x>20&&this.y<60) this.open = Math.random() > 0.55;
				else this.open = Math.random() > 0.75;
				break;
			case 2:
				if ((this.x>40&&this.y>75)||(this.x>75&&this.y>40)) this.open = true;
				else if (this.x>20&&this.y>20) this.open = Math.random() > 0.55;
				else this.open = Math.random() > 0.75;
				break;
			case 3:
				if ((this.x<40&&this.y>75)||(this.x<5&&this.y>40)) this.open = true;
				else if (this.x<60&&this.y>20) this.open = Math.random() > 0.55;
				else this.open = Math.random() > 0.75;
				break;
		}
	});

	world.initialize([
		{ name: 'wall', distribution: 100 }
	]);

	for (i=0; i<20; i++) {
		world.step();
		world.iteration++;
	}

	var grid = world.createGridFromValues([
		{ cellType: 'wall', hasProperty: 'open', value: 1 }
	], 0);

	//-------------------World details----------------------
	world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0
	});

	//---------------Water Details--------------
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
			if (config.wDecorations&&this.countSurroundingCellsWithValue(neighbors, 'deepWater')==8&&getChance(40, 1)&&world.iteration==29) {
				if (!this.isInRange(6, 'waterDecoration', world)) {
					this.waterDecoration = true;
					this.Sprite = new Image();
					const whichSprite = Math.floor(Math.random()*3)
					switch (whichSprite) {
						case 0:
							this.Sprite.src = "images/ship.png";
							break;
						case 1:
							this.Sprite.src = "images/waterMonster.png";
							break;
						case 2:
							this.Sprite.src = "images/wave.png";
							break;
					}
				}
			}
		}
	}, function () {
		this.water = true;
	});

	//-----------------------Land Details-----------------------
	world.registerCellType('island', {
		isSolid: true,
		spriteNr: null,
		getColor: function() {
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
			if ((this.terrain||this.beach||this.forest)&&this.countSurroundingCellsWithValue(neighbors, 'river')>1&&world.iteration==29) { 
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i&&!neighbors[i].createdRiver) 	{ 
						this.river = true;
						this.forest = false;
						this.beach = false;
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
			if (this.forest) {
				this.forest  = true;
				if (this.Sprite===undefined) {
					this.Sprite = new Image();
					const val = Math.floor(Math.random()*4);
					switch (val) {
						case 0:
							this.Sprite.src = "images/forest.png"
							break;
						case 1:
							this.Sprite.src = "images/forest2.png"
							break;
						case 2:
							this.Sprite.src = "images/forest3.png"
							break;
						case 3:
							this.Sprite.src = "images/forest4.png"
							break;
					}
				}
			}
			if (this.terrain&&getChance(40,1*config.forests)&&this.countSurroundingCellsWithValue(neighbors, 'beach')<2
				&&this.countSurroundingCellsWithValue(neighbors, 'forest')>=1&&world.iteration>3) {
				this.forest = true;
				this.Sprite = new Image();
				const val = Math.floor(Math.random()*4);
				switch (val) {
					case 0:
						this.Sprite.src = "images/forest.png"
						break;
					case 1:
						this.Sprite.src = "images/forest2.png"
						break;
					case 2:
						this.Sprite.src = "images/forest3.png"
						break;
					case 3:
						this.Sprite.src = "images/forest4.png"
						break;
				}
			}

			//-------------------beach generation-------------------
			if ((this.beach && this.countSurroundingCellsWithValue(neighbors, 'water') > 1 && this.countSurroundingCellsWithValue(neighbors, 'beach')>0 
				&& (this.countSurroundingCellsWithValue(neighbors, 'terrain')>1||this.countSurroundingCellsWithValue(neighbors, 'forest')))
				||(this.beach&&this.countSurroundingCellsWithValue(neighbors, 'river')>1)
				||(this.beach&&this.countSurroundingCellsWithValue(neighbors, 'water')>3&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1)
				||(this.terrain&&this.countSurroundingCellsWithValue(neighbors, 'water')>3&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1)) {
				this.beach = true;
				this.forest = false;
				//applying proper sprite from the spritesheat
				if (this.spriteNr==null&&neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null) {
						if (neighbors[1].water&&neighbors[3].water&&neighbors[4].water&&!neighbors[6].water) this.spriteNr = 1;
						else if (neighbors[6].water&&neighbors[3].water&&neighbors[4].water&&!neighbors[1].water) this.spriteNr = 2;
						else if (neighbors[6].water&&neighbors[1].water&&neighbors[4].water&&!neighbors[3].water) this.spriteNr = 3;
						else if (neighbors[6].water&&neighbors[1].water&&neighbors[3].water&&!neighbors[4].water) this.spriteNr = 4;
						else if (neighbors[1].water&&neighbors[4].water&&!neighbors[3].water&&!neighbors[6].water) this.spriteNr = 5;
						else if (neighbors[1].water&&neighbors[3].water&&!neighbors[4].water&&!neighbors[6].water) this.spriteNr = 6;
						else if (neighbors[6].water&&neighbors[3].water&&!neighbors[4].water&&!neighbors[1].water) this.spriteNr = 7;
						else if (neighbors[6].water&&neighbors[4].water&&!neighbors[3].water&&!neighbors[1].water) this.spriteNr = 8;
					}
			}
			else {
				this.beach = false;
			}

			//-------------------terrain generation-------------------
			if (!this.mountain&&!this.cliff&&!this.river&&!this.city&&!this.forest&&!this.landDecoration&&!this.beach&&!this.water) {
				this.terrain = true;
			}
			else {
				this.terrain = false;
			}
			//applying proper sprite from the spritesheat
			if (this.terrain) {
				if (neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null&&!this.spriteApply&&world.iteration==3) {
					this.spriteApply = true;
					if (neighbors[1].beach&&neighbors[4].beach) this.spriteNr = 3;
					else if (neighbors[1].beach&&neighbors[3].beach) this.spriteNr = 4;
					else if (neighbors[6].beach&&neighbors[4].beach) this.spriteNr = 5;
					else if (neighbors[6].beach&&neighbors[3].beach) this.spriteNr = 6;
					else if (neighbors[1].water&&neighbors[4].water&&!neighbors[3].water&&!neighbors[6].water) this.spriteNr = 7;
					else if (neighbors[1].water&&neighbors[3].water&&!neighbors[4].water&&!neighbors[6].water) this.spriteNr = 8;
					else if (neighbors[6].water&&neighbors[3].water&&!neighbors[4].water&&!neighbors[1].water) this.spriteNr = 9;
					else if (neighbors[6].water&&neighbors[4].water&&!neighbors[3].water&&!neighbors[1].water) this.spriteNr = 10;
					else {
						this.spriteNr = Math.floor(Math.random()*2);
					}
				}
			}

			//-------------------mountain generation-------------------
			if ((world.iteration<4&&getChance(12,1*config.mountains)&&!this.countSurroundingCellsWithValue(neighbors, 'water')&&!this.countSurroundingCellsWithValue(neighbors, 'beach')&&this.countSurroundingCellsWithValue(neighbors, 'mountain')>=1)) {
				this.mountain = true;
				if (getChance(3,1)) this.mountainSize = 24;
				else this.mountainSize = 30;
			}
			if (this.mountain&&!this.countSurroundingCellsWithValue(neighbors, 'water')) this.mountain = true;
			
			//-----------------------Land Decoration generation--------------
			if (this.landDecoration||(this.terrain||this.forest)&&config.lDecorations&&this.countSurroundingCellsWithValue(neighbors, 'water')<1&&getChance(30, 1)&&world.iteration==29) {
				if (!this.isInRange(8, 'landDecoration', world)&&!this.isInRange(8, 'city', world)&&!this.isInRange(2, 'water', world)) {
					this.landDecoration = true;
					this.forest = false;
					this.Sprite = new Image();
					this.Sprite.src = getChance(2,1) ? "images/village.png" : "images/castle.png";
				}
			}
			//cliff generation
			//this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

		//generate proper cells on first world creation
	}, function () {
		this.island = true;
		if (config.beaches!=0) this.beach = Math.random() > 0.2-config.beaches*0.2;
		if (config.mountains!=0&&Math.random() > 1-config.mountains*0.01) {
			this.mountain = true;
			if (getChance(3,1)) this.mountainSize = 24;
			else this.mountainSize = 30;
		}
		if (config.forests!=0) this.forest = Math.random() > 1-config.forests*0.02;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	initializeWorld(world);
	return world;
};



/* neighbors:
0 lewa góra
1 góra
2
3 lewo
4 prawo
5
6 dół
7
*/