// App requirements
var gw2nodelib = require("gw2nodelibvz");
var expressApp = require("express")();
var http = require("http").Server(expressApp);
var io = require("socket.io")(http);

// Variables to hold the current values for each type of material in the trading post
var woods;
var ores;
var leathers;
var scraps;

// Variables to control wood & ores
var woodReady = false;
var oreReady = false;

// Since the gw2 trading post cuts 15% of every sale our profit will only be 85%
var profit = 0.85;

// Returns index page on request
expressApp.get("/", function(req, res){
	res.sendFile("index.html", {root: __dirname});
});

// When someone connects to the server it gets the current prices
io.on("connection", function(socket){
	woodReady = false;
	oreReady = false;
	getMatsPrices();
});

function getMatsPrices(){
	// Ask gw2 servers for wood prices
	var woodsIds = "?ids=19723,19726,19727,19724,19722";
	gw2nodelib.prices(woodsRes, woodsIds, true);
	
	// Ask gw2 servers for ores prices
	var oresIds = "?ids=19697,19699,19702,19700";
	gw2nodelib.prices(oresRes, oresIds, true);
	
	// Ask gw2 servers for leathers prices
	var leathersIds = "?ids=19719,19728,19730,19731,19729";
	gw2nodelib.prices(leathersRes, leathersIds, true);
	
	// Ask gw2 servers for scraps prices
	var scrapsIds = "?ids=19718,19739,19741,19743,19748";
	gw2nodelib.prices(scrapsRes, scrapsIds, true);
}

// Given a fullValue ammount of coins returns the gold portion as an int value
function gold( fullValue ){
	return ~~(fullValue/10000);
}

// Given a fullValue ammount of coins returns the silver portion as an int value
function silver( fullValue ){
	return ~~((fullValue/100)%100);
}

// Given a fullValue ammount of coins returns the copper portion as an int value
function copper( fullValue ){
	return ~~(fullValue%100);
}

// Saves the json from gw2 servers and calculates profit of salvaging gear for wood
var woodsRes = function(data){
	var _woodTypes = 5;
	var _woodGivers = 3;
	var woodMultis = [1.85, 1.1, 1.0];
	var arrPos = [1, 3, 4, 2, 0];

	// Save wood prices
	woods = data;
	var woodsResults = new Array();
	
	for(var i=0; i<_woodTypes; i++){
		for(var j=0; j<_woodGivers; j++){
			var stdvl = Math.floor(woods[arrPos[i]]["sells"]["unit_price"]*woodMultis[j]*profit);
			woodsResults.push( [gold(stdvl), silver(stdvl), copper(stdvl)] );
		}
	}

	io.sockets.emit("wood", woodsResults, _woodGivers, _woodTypes);
	woodReady = true;
	woodsOresRes();
}

// Saves the json from gw2 servers and calculates profit of salvaging gear for ore
var oresRes = function(data){
	var _oreTypes = 4;
	var _oreGivers = 4;
	var oreMultis = [1.8, 1.2, 2.45, 1.35];
	var arrPos = [0, 1, 3, 2];
	
	// Save ore prices
	ores = data;
	var oresResults = new Array();
	
	for(var i=0; i<_oreTypes; i++){
		for(var j=0; j<_oreGivers; j++){
			var stdvl = Math.floor(ores[arrPos[i]]["sells"]["unit_price"]*oreMultis[j]*profit);
			oresResults.push( [gold(stdvl), silver(stdvl), copper(stdvl)] );
		}
	}

	io.sockets.emit("ore", oresResults, _oreGivers, _oreTypes);
	oreReady = true;
	woodsOresRes();
}

// Saves the json from gw2 servers and calculates profit of salvaging gear for leather
var leathersRes = function(data){
	var _leatherTypes = 5;
	var _leatherGivers = 2;
	var leatherMultis = [3.1, 2.1];
	var arrPos = [0, 1, 3, 4, 2];

	// Save wood prices
	leathers = data;
	var leathersResults = new Array();
	
	for(var i=0; i<_leatherTypes; i++){
		for(var j=0; j<_leatherGivers; j++){
			var stdvl = Math.floor(leathers[arrPos[i]]["sells"]["unit_price"]*leatherMultis[j]*profit);
			leathersResults.push( [gold(stdvl), silver(stdvl), copper(stdvl)] );
		}
	}

	io.sockets.emit("leather", leathersResults, _leatherGivers, _leatherTypes);
}

// Saves the json from gw2 servers and calculates profit of salvaging gear for scrap
var scrapsRes = function(data){
	var _scrapTypes = 5;
	var _scrapGivers = 2;
	var scrapMultis = [3.1, 2.1];
	var arrPos = [0, 1, 2, 3, 4];

	// Save wood prices
	scraps = data;
	var scrapsResults = new Array();
	
	for(var i=0; i<_scrapTypes; i++){
		for(var j=0; j<_scrapGivers; j++){
			var stdvl = Math.floor(scraps[arrPos[i]]["sells"]["unit_price"]*scrapMultis[j]*profit);
			scrapsResults.push( [gold(stdvl), silver(stdvl), copper(stdvl)] );
		}
	}

	io.sockets.emit("scrap", scrapsResults, _scrapGivers, _scrapTypes);
}

function woodsOresRes(){
	if( oreReady && woodReady ){
		woodReady = false;
		oreReady = false;
		var _woreTypes = 5;
		var _woreGivers = 3;
		var woreMultis = [0.9, 0.6, 0.5];
		var arrPos = [[1, 0], [3, 1], [4, 1], [2, 3], [0, 2]]; // [wood, ore] //
		
		// Save wore prices
		var woresResults = new Array();
		
		for(var i=0; i<_woreTypes; i++){
			for(var j=0; j<_woreGivers; j++){
				var stdvl = Math.floor((woods[arrPos[i][0]]["sells"]["unit_price"]*woreMultis[j]+ores[arrPos[i][1]]["sells"]["unit_price"]*woreMultis[j])*profit);
				woresResults.push( [gold(stdvl), silver(stdvl), copper(stdvl)] );
			}
		}
		
		io.sockets.emit("wore", woresResults, _woreGivers, _woreTypes);
	}
}

http.listen(8000);

// To each result multiply by 0.85 because of trading post taxes //
// Divide each final result by 100 to get values in silver // DONE (Results are in xG yS zC //

/*
				[0,    1,     2,     3,     4    ]
	Wood 		[1-20, 16-33, 31-48, 46-63, 64-80]
	Longbow / Shortbow / Staff / Trident 	-> 1.85
	Scepter / Torch							-> 1.1
	Focus									-> 1.0
	
				[00,   11,    21,     32,     43 ]
	Wood + Ore 	[1-23, 24-33, 33-48, 49-63, 63-80]
	Hammer / Harpoon Gun / Spear			-> 0.9 | 0.9
	Axe / Mace / Pistol / Rifle				-> 0.6 | 0.6
	Shield									-> 0.5 | 0.5
	
				[0,    1,     2,     3    ]
	Ore 		[1-23, 19-55, 49-62, 63-80]
	Greatsword								-> 1.8
	Sword / Dagger / Warhorn				-> 1.2
	Heavy Coat								-> 2.45
	Heavy Non-Coat							-> 1.35
	
				[0,    1,     2,     3,     4    ]
	Leather 	[1-18, 16-33, 31-48, 46-63, 61-80]
	Medium Coat								-> 3.1
	Medium Non-Coat							-> 2.1
	
				[0,    1,     2,     3,     4    ]
	Scrap 		[1-18, 16-33, 31-50, 46-63, 61-80]
	Light Coat								-> 3.1
	Light Non-Coat							-> 2.1
*/

/* 	
	Wood
	Green Wood Log 				-> 	19723	->	1
	Soft Wood Log 				-> 	19726	->	3
	Seasoned Wood Log 			-> 	19727	->	4
	Hard Wood Log 				->	19724	->	2
	Elder Wood Log				->	19722	->	0
	
	Ores
	Copper Ore					->	19697	->	0
	Iron Ore					->	19699	->	1
	Platinum Ore				->	19702	->	3
	Mithril Ore					->	19700	->	2
	
	Leather
	Rawhide Leather Section		->	19719	->	0
	Thin Leather Section		->	19728	->	1
	Coarse Leather Section		->	19730	->	3
	Rugged Leather Section		->	19731	->	4
	Thick Leather Section		->	19729	->	2
	
	Scrap
	Jute Scrap					->	19718	->	0
	Wool Scrap					->	19739	->	1
	Cotton Scrap				->	19741	->	2
	Linen Scrap					->	19743	->	3
	Silk Scrap					->	19748	->	4
*/