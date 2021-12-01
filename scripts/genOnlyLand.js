function genOnlyLand(config, generateCityName, cityNames) {
	var colorPalette = {
		shallow: 'rgb(52, 235, 229)',
		mShallow: 'rgb(52, 177, 235)',
		deepWater: 'rgb(51, 153, 255)',
		river: 'rgb(79, 120, 255)',
		red: 'rgb(200,30,30)'
	}

	//------------------------Basic world shape------------------------
	var world = new CAWorld({
		width: 80,
		height: 80,
		cellSize: 10,
		iteration:0,
	});

	world.registerCellType('wall', {
		process: function (neighbors) {
		},
		reset: function () {
		}
	}, function () {
		this.open = true;
	});

	world.initialize([
		{ name: 'wall', distribution: 100 }
	]);

	for (i=0; i<=config.worldSteps; i++) {
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
		iteration:0,
		isDesertCreated:false
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
			const riverSurround = this.countSurroundingCellsWithValue(neighbors, 'river');
			const terrainSurround = this.countSurroundingCellsWithValue(neighbors, 'terrain');
			const mountainSurround = this.countSurroundingCellsWithValue(neighbors, 'mountain');
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

					if (getChance(10,1*config.rivers+add)&&!this.createdRiver) {
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
			if ((world.iteration==1&&getChance(16,1*config.rivers)&&mountainSurround==1)&&riverSurround==0) {
				this.river = true;
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].mountain) this.riverSource = i;
					else if (neighbors[i]&&neighbors[i].river) this.riverSource = i;
				}
			}
			//generating next river cells
			else if ((this.terrain||this.forest)&&riverSurround==1) {
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i) 	{ 
						this.river = true;
						this.forest = false;
						if (!config.sprawlingRivers) neighbors[i].createdRiver = true;
					}
				}
			}
			if ((this.terrain||this.forest)&&riverSurround>1&&world.iteration==config.detailSteps) { 
				for (i=0;i<8;i++) {
					if (neighbors[i]&&neighbors[i].river&&neighbors[i].riverSource===i&&!neighbors[i].createdRiver) 	{ 
						this.river = true;
						this.forest = false;
					}
				}
			}
			//generating cells to fill diagonal cells between river cells
			if (!this.city&&riverSurround>1) {
				if (neighbors[1]!=null&&neighbors[3]!=null&&neighbors[4]!=null&&neighbors[6]!=null&&world.iteration==config.detailSteps) {
					if (neighbors[6].river&&neighbors[3].river&&!neighbors[4].river&&!neighbors[1].river) {this.spriteNr = 0; this.riverFill = true; this.forest = false}
					else if (neighbors[6].river&&neighbors[4].river&&!neighbors[3].river&&!neighbors[1].river) {this.spriteNr = 1; this.riverFill = true; this.forest = false}
					else if (neighbors[1].river&&neighbors[4].river&&!neighbors[3].river&&!neighbors[6].river) {this.spriteNr = 2; this.riverFill = true; this.forest = false}
					else if (neighbors[1].river&&neighbors[3].river&&!neighbors[4].river&&!neighbors[6].river) {this.spriteNr = 3; this.riverFill = true; this.forest = false}
				}
			}


			//-------------------city generation-------------------
			if (world.iteration>config.detailSteps-10&&(this.terrain)&&getChance(400/config.cities,1)
			&&!this.isInRange(8, 'city', world)
			||world.iteration>config.detailSteps-10&&(this.terrain||this.forest)&&riverSurround>1&&!mountainSurround&&getChance(400/config.cities,1)
			&&!this.isInRange(8, 'city', world)) {
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
				this.forest = true;
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
			if (this.terrain&&getChance(80/config.forests,1)&&forestSurround>0&&world.iteration>3) {
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
			if (!this.desert&&!this.mountain&&!this.cliff&&!this.river&&!this.city&&!this.forest&&!this.landDecoration&&!this.mine) {
				this.terrain = true;
			}
			else {
				this.terrain = false;
			}
			//applying proper sprite from the spritesheat
			if (this.terrain) {
				if (!this.spriteApply&&world.iteration==3) {
					this.spriteApply = true;
					this.spriteNr = Math.floor(Math.random()*2);
				}
			}
			

			//-------------------mountain generation-------------------
			if ((world.iteration<4&&getChance(12,1)&&mountainSurround>=1)) {
				this.mountain = true;
				this.mountainSize = getChance(3,1) ? 24 : 30;
			}
			if (this.mountain) this.mountain = true;
			
			//-----------------------Land Decoration generation--------------
			if (config.lDecorations&&world.iteration==config.detailSteps&&(this.terrain||this.forest)&&getChance(30, 1)) {
				if (!this.isInRange(8, 'landDecoration', world)&&!this.isInRange(8, 'city', world)) {
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
			//cliff generation
			//this.cliff = this.countSurroundingCellsWithValue(neighbors, 'water')>1&&this.countSurroundingCellsWithValue(neighbors, 'beach')>1;
		}

		//generate proper cells before first world step
	}, function () {
		this.island = true;
		if (config.mountains!=0&&Math.random() > 1-config.mountains*0.01) {
			this.mountain = true;
			this.mountainSize = getChance(3,1) ? 24 : 30;
		}
		if (config.forests!=1) this.forest = Math.random() > 1-config.forests*0.02;
	});

	world.initializeFromGrid([
		{ name: 'island', gridValue: 1 },
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