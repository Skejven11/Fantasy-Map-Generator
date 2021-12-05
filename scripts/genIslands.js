function genIslands(config, generateCityName, cityNames) {
	var colorPalette = {
		shallow: 'rgb(52, 235, 229)',
		mShallow: 'rgb(52, 177, 235)',
		deepWater: 'rgb(51, 153, 255)',
		river: 'rgb(79, 120, 255)',
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

	world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0,
		isDesertCreated:false
	});

	//---------------Water Details--------------
	world.registerCellType('water', {
		getColor: function () {
			if (this.shallow) return colorPalette.shallow;
			else if (this.mediumShallow) return colorPalette.mShallow;
			else if (this.deepWater) return colorPalette.deepWater;
		},

		process: function (neighbors) {
			if (this.countSurroundingCellsWithValue(neighbors, 'beach')>1&&world.iteration>3) {
				this.shallow = true;
				this.mediumShallow = false;
				if (this.spriteNr==null&&neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null&&world.iteration==config.detailSteps) {
					if (neighbors[1].mediumShallow&&neighbors[4].mediumShallow&&!neighbors[3].mediumShallow&&!neighbors[6].mediumShallow) this.spriteNr = 1;
					else if (neighbors[1].mediumShallow&&neighbors[3].mediumShallow&&!neighbors[4].mediumShallow&&!neighbors[6].mediumShallow) this.spriteNr = 2;
					else if (neighbors[6].mediumShallow&&neighbors[3].mediumShallow&&!neighbors[4].mediumShallow&&!neighbors[1].mediumShallow) this.spriteNr = 3;
					else if (neighbors[6].mediumShallow&&neighbors[4].mediumShallow&&!neighbors[3].mediumShallow&&!neighbors[1].mediumShallow) this.spriteNr = 4;
					else this.spriteNr = 0;
				}
			}
			if (!this.shallow && (this.countSurroundingCellsWithValue(neighbors, "shallow")>0 || this.countSurroundingCellsWithValue(neighbors, 'island')>2)&&world.iteration>3) {
				this.mediumShallow = true;
				this.shallow = false;
				if (this.spriteMNr==null&&neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null&&world.iteration==config.detailSteps) {
					if (neighbors[1].deepWater&&neighbors[4].deepWater&&!neighbors[3].deepWater&&!neighbors[6].deepWater) this.spriteMNr = 6;
					else if (neighbors[1].deepWater&&neighbors[3].deepWater&&!neighbors[4].deepWater&&!neighbors[6].deepWater) this.spriteMNr = 7;
					else if (neighbors[6].deepWater&&neighbors[3].deepWater&&!neighbors[4].deepWater&&!neighbors[1].deepWater) this.spriteMNr = 8;
					else if (neighbors[6].deepWater&&neighbors[4].deepWater&&!neighbors[3].deepWater&&!neighbors[1].deepWater) this.spriteMNr = 9;
					else this.spriteMNr = 5;
				}
			}
			this.deepWater = !this.shallow&&!this.mediumShallow&&!this.waterDecoration;
			if (config.wDecorations&&this.countSurroundingCellsWithValue(neighbors, 'deepWater')==8&&getChance(80, 1)&&world.iteration>config.detailSteps-10) {
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
			if(this.desert) return 'rgb(255, 255, 102)';
			else if (this.river) return colorPalette.river;
			else {
				var v = Math.floor(Math.random()*17);
				var g = (140+v).toString();
				return 'rgb(34,'+g+',50)';
			}
		},

		process: function(neighbors) {
			const waterSurround = this.countSurroundingCellsWithValue(neighbors, 'water');
			const riverSurround = this.countSurroundingCellsWithValue(neighbors, 'river');
			const terrainSurround = this.countSurroundingCellsWithValue(neighbors, 'terrain');
			const mountainSurround = this.countSurroundingCellsWithValue(neighbors, 'mountain');
			const beachSurround = this.countSurroundingCellsWithValue(neighbors, 'beach');
			const citySurround = this.countSurroundingCellsWithValue(neighbors, 'city');
			const forestSurround = this.countSurroundingCellsWithValue(neighbors, 'forest');
			const desertSurround = this.countSurroundingCellsWithValue(neighbors, 'desert');

			//------------------river generation-------------------
			//changing direction of rivers
			if (this.river) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;

					var  add = 0;
					if (this.riverSource==7||this.riverSource==4||this.riverSource==2) var add=4;

					if (waterSurround>1) this.riverSource = false;
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
			if ((world.iteration==1&&getChance(16,1*config.rivers)&&mountainSurround==1)&&riverSurround==0
			&&!waterSurround&&!beachSurround) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;
				}
			}
			//generating next river cells
			else if ((this.terrain||this.beach||this.forest)&&riverSurround==1) {
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i) 	{ 
						this.river = true;
						this.forest = false;
						this.beach = false;
						if (!config.sprawlingRivers) neighbors[i].createdRiver = true;
					}
				}
			}
			if ((this.terrain||this.beach||this.forest)&&riverSurround>1&&world.iteration==config.detailSteps) { 
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i&&!neighbors[i].createdRiver) 	{ 
						this.river = true;
						this.forest = false;
						this.beach = false;
					}
				}
			}
			//generating cells to fill diagonal cells between river cells
			if (this.island&&!this.city&&riverSurround>1) {
				if (neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null&&world.iteration==config.detailSteps) {
					if (neighbors[6].river&&neighbors[3].river&&!neighbors[4].river&&!neighbors[1].river) {this.spriteNr = 0; this.riverFill = true; this.forest = false}
					else if (neighbors[6].river&&neighbors[4].river&&!neighbors[3].river&&!neighbors[1].river) {this.spriteNr = 1; this.riverFill = true; this.forest = false}
					else if (neighbors[1].river&&neighbors[4].river&&!neighbors[3].river&&!neighbors[6].river) {this.spriteNr = 2; this.riverFill = true; this.forest = false}
					else if (neighbors[1].river&&neighbors[3].river&&!neighbors[4].river&&!neighbors[6].river) {this.spriteNr = 3; this.riverFill = true; this.forest = false}
				}
			}


			//-------------------city generation-------------------
			if (world.iteration>config.detailSteps-10&&(this.terrain||this.beach)&&waterSurround>2&&waterSurround<5&&getChance(200/config.cities,1)
			&&!this.isInRange(8-config.cities, 'city', world)
			||world.iteration>config.detailSteps-10&&(this.terrain||this.forest)&&riverSurround>1&&!mountainSurround&&getChance(200/config.cities,1)
			&&!this.isInRange(8-config.cities, 'city', world)) {
				this.city=true;
				this.terrain=false;
				this.Sprite = new Image();
				const whichSprite = Math.floor(Math.random()*3)
				switch (whichSprite) {
					case 0:
						this.font = "11px Fondamento";
						this.cityName = generateCityName(cityNames);
						this.Sprite.src = "images/city0.png";
						break;
					case 1:
						this.font = "13px Fondamento"
						this.cityName = generateCityName(cityNames);
						this.Sprite.src = "images/city1.png";
						break;
					case 2:
						this.font = "15px Fondamento"
						this.cityName = generateCityName(cityNames);
						this.Sprite.src = "images/city2.png";
						break;
					}
			}

			//-------------------forest generation-------------------
			if (this.forest) {
				if (waterSurround==0) this.forest = true;
				else this.forest = false;
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
			if (this.terrain&&getChance(80/config.forests,1)&&beachSurround<2
				&&forestSurround>0&&world.iteration>3&&waterSurround<1) {
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
			if ((this.beach && waterSurround > 1 && beachSurround>0 && (terrainSurround>1||desertSurround>1||forestSurround>1))
				||(this.beach&&riverSurround>1)
				||(this.beach&&waterSurround>3&&beachSurround>1)
				||(this.terrain&&waterSurround>1&&beachSurround>1)) {
				this.beach = true;
				this.forest = false;
				this.terrain = false;
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
						else this.spriteNr = 0;
					}
			}
			else {
				this.beach = false;
			}

			//-------------------Desert Generation-------------------
			//not sure if I will implement this, looks like a lot of work for it to look good
			/*if (world.iteration>3&&(this.terrain||this.forest)&&beachSurround>1&&!world.isDesertCreated) {
				if (getChance(10, 1)) {
					world.isDesertCreated = true;
					this.desert = true;
					this.terrain = false;
					this.forest = false;
					console.log("XD")
				}
			}
			if (this.desert
				||((this.terrain||this.forest)&&desertSurround>0&&getChance(5,1))
				||((this.terrain||this.forest)&&desertSurround>4)) {
				this.desert = true
				this.terrain = false;
				this.forest = false;
			}*/

			//-------------------terrain generation-------------------
			if (!this.desert&&!this.mountain&&!this.cliff&&!this.river&&!this.city&&!this.forest&&!this.landDecoration&&!this.beach&&!this.water&&!this.mine) {
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
			if ((world.iteration<4&&getChance(12,1)&&!waterSurround&&!beachSurround&&mountainSurround>=1)) {
				this.mountain = true;
				this.mountainSize = getChance(3,1) ? 24 : 30;
			}
			if (this.mountain&&!waterSurround) this.mountain = true;
			
			//-----------------------Land Decoration generation--------------
			if (config.lDecorations&&world.iteration==config.detailSteps&&(this.terrain||this.forest)&&waterSurround<1&&getChance(30, 1)) {
				if (!this.isInRange(8, 'landDecoration', world)&&!this.isInRange(8, 'city', world)&&!this.isInRange(2, 'water', world)) {
					this.landDecoration = true;
					this.forest = false;
					this.Sprite = new Image();
					this.Sprite.src = getChance(2,1) ? "images/village.png" : "images/castle.png";
				}
			}
			//-------------------------mines------------------------
			if (config.lDecorations&&world.iteration==config.detailSteps&&(this.terrain||this.forest)&&mountainSurround>2&&getChance(10,1)&&!this.isInRange(8, 'mine', world)) {
				this.mine = true;
				this.forest = false;
				this.Sprite = new Image();
				const val = Math.floor(Math.random()*3);
				switch (val) {
					case 0:
						this.Sprite.src = "images/mineG.png"
						break;
					case 1:
						this.Sprite.src = "images/mineS.png"
						break;
					case 2:
						this.Sprite.src = "images/mineC.png"
						break;
				}
			}
			//--------------------------lighthouses------------------
			if (config.lDecorations&&world.iteration==config.detailSteps&&(this.terrain||this.beach)&&waterSurround>2&&getChance(20,1)&&!this.isInRange(12, 'lighthouse', world)&&!this.isInRange(4, 'city', world)) {
				this.lighthouse = true;
				this.forest = false;
				this.Sprite = new Image();
				this.Sprite.src = "images/lighthouse.png"
			}
			//cliff generation
			//this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

		//generate proper cells before first world step
	}, function () {
		this.island = true;
		if (config.beaches!=0) this.beach = Math.random() > 0.6-config.beaches*0.2;
		if (config.mountains!=0&&Math.random() > 1-config.mountains*0.01) {
			this.mountain = true;
			this.mountainSize = getChance(3,1) ? 24 : 30;
		}
		if (config.forests!=1) this.forest = Math.random() > 1-config.forests*0.02;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
		{ name: 'water', gridValue: 0 }
	], grid);

	initializeWorld(world);
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