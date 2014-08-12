function Shot(x, y, t, src){
    this.t = t;
    this.x = x;
    this.y = y;
    this.src = src;
    this.hit = null;
}

function Target(str=null){
     //if (str == null) {
    this.id = Date.now();
    this.x = [];
    this.y = [];
    this.t = [];
    this.end_t = Infinity;
    /*} else {
        var parts = str.split(';');
        var id = parts[0];
        var t = parts[1].split(',');
        var x = parts[2].split(',');
        var y = parts[3].split(',');
        var end_t = parts[4];
        
        this.id = parseInt(id);
        this.t = t.map(parseFloat);
        this.x = x.map(parseFloat);
        this.y = y.map(parseFloat);
        this.end_t = parseFloat(end_t)
    }*/
}

addTargetPoint = function(trg, x, y, t) {
    var loc = findInsertIndex(trg, t);
    trg.t.splice(loc, 0, t);
    trg.x.splice(loc, 0, x);
    trg.y.splice(loc, 0, y);
}
delTargetEnd = function(trg) {
    console.log("delTargetEnd")
    trg.end_t = Infinity;
}

delTargetPoint = function(trg, loc) {
    console.log("delTargetPoint")
    trg.x.splice(loc, 1);
    trg.y.splice(loc, 1);
    trg.t.splice(loc, 1);
}

/*Target.prototype.toString = function() {
    var s = "" + this.id
    s += ';' + this.t.map( function(x) { return x.toPrecision(3); }).join();
    s += ';' + this.x.map( function(x) { return x.toPrecision(3); }).join();
    s += ';' + this.y.map( function(x) { return x.toPrecision(3); }).join();
    s += ';' + this.end_t.toPrecision(3);
    return s
}*/

Target.prototype

var points = 0;

var shots = [];
var correct_shots = [];

/* var targets = [[[801,259, 3.789], [615, 259, 9.877]],  
[[434, 292, 2.224], [506, 284, 6.623], [778, 272, 12.407999], [380, 337, 14.664], [490, 302, 17.351], [582, 300, 19.487],[385, 283, 21.015], [630, 298, 21.968], [671, 264, 23.345], [819, 271, 26.103999], [435, 297, 29.072], [487, 296, 29.967], [854, 302, 33.64], [871, 275, 35.255999] ] , 
[[517, 246, 6.983], [759, 246, 8.502999], [385, 261, 10.289]], 
[[602, 291, 5.647], [795, 255, 12.535999], [789, 272, 17.4]], 
[ [618, 282, 9.396], [478, 285, 12.947], [368,308, 14.958]],
[ [789, 284, 18.063], [621, 260, 26.302999]]];
*/


function findInsertIndex(arr, val) {
    /*
        Assuming a sorted array arr, return the index where the val 
        should be inserted in order to keep the arr sorted.
        Helper function for keeping the targets sorted in time. 
    */
    var ipnt = arr.length;
    for (var i=0; i<arr.length; i++) {
        if (val < arr[i]) { 
            ipnt = i;
            break;
        } 
    }
    return ipnt;
}



// Targets loading saving functions


function loadLocalTargets() {
    // Load targets from JSON data stored on localstorage, from item "targets"
    var targets = {};
    var targets_s = localStorage.getItem("targets");
    if (targets_s != null) { // if not available, make empty dict
        targets = JSON.parse(targets_s);
    } 
    return targets;
}

function saveLocalTargets(all_targets) {
    // save targets to localStorage as JSON
    localStorage.setItem("targets", JSON.stringify(all_targets))
}

function getSourceTargets(all_targets, src) {
    
    // Helper function to get an array of targets for the specific video
    // The file name of the clip is parsed, and used as the key to pick the right targets, regardless of
    // the path of the clip.
    // If the clipname is not present, an empty array is returned for convenience. 
    var clipname = src.split("/").pop();
    var src_trgs = all_targets[clipname];
    //console.log(src +" - "+ clipname + " - " + src_trgs);
    if (typeof src_trgs == "undefined") { // if empty
        src_trgs = [];
    }
    
    return src_trgs;
}

var clipset_pos = 0;

var clipset =  [ ["1", "../clips/jalankulkijat.mp4"],
                 ["2", "../clips/potkulautailija.mp4"] , 
                 ["3", "../clips/isoroba.mp4"], 
                 ["4", "../clips/jalankulkija_ja_suojatie.mp4" ] , 
                 ["5", "../clips/jalankulkijat2.mp4"], 
                 ["6", "../clips/vastaantulijat.mp4"], 
                 ["7", "../clips/ratikka.mp4"]];

var correct_hit_interval = 2.5;
   
function checkTargetHit(shot){
    // version 2 using anno targets

    var all_targets = loadLocalTargets(); // this should not be done everytime, cache
    var trgs = getSourceTargets(all_targets, shot.src);

	var hit_radius = 0.1;
    
	for (var i=0; i< trgs.length; i++) {
		var trg = trgs[i]; 
        
        var loc = findInsertIndex(trg.t, shot.t);
        if ((loc > 0) && (shot.t < trg.end_t)) {
            loc = loc - 1; // set the right index to the target to be compared 
            var d2 = Math.sqrt(Math.pow(shot.x - trg.x[loc], 2) + Math.pow(shot.y - trg.y[loc], 2));
            if (d2 < hit_radius){
                return true;
            };
		};
	};
    return false;
};

function registerShot(x, y, t) {
    var src = clipset[clipset_pos][1];
    var relCoords = client2Rel(x, y);

    console.log("x=" + x + " y=" + y + " time=" + t + " src=" + src);
    console.log("Suhteellinen sijainti: " + relCoords);

    
    var shot = new Shot(relCoords[0], relCoords[0], t, src);
    shots.push(shot);
    return shot;
}

function startVideo() {
   var vplayer = document.getElementById("videoplayer");
   var width=vplayer.offsetWidth;
   var height=vplayer.offsetHeight;
   vplayer.src = clipset[clipset_pos][1];
   vplayer.play();
   correct_shots = [];  //tyhjentää correct_shots -listan ettei edellisten klippien datat vaikuta seuraavaan
   shots = [];				// tyhjentää shotslistan seuraavaa videota varten
   console.log(height, width);
};

function stopVideo() {
   var vplayer = document.getElementById("videoplayer");
   vplayer.stop();
};

function videoClicked(ev) {
    
    var vplayer = document.getElementById("videoplayer");
    var thplayer = document.getElementById("targethitplayer");
    var ctime = vplayer.currentTime;
    
	if (ctime > 0.0) {
        var x = ev.clientX;
        var y = ev.clientY;
        
        // gui update
        var hp_tmpl = document.getElementById("hitpoint_tmpl"); 				//etsii hitpoint_tmpl nimisen divin html-tiedostosta
        var hp = hp_tmpl.cloneNode();										//kloonaa sen
        hp.id = "hitpoint_" + Math.round(ctime*1000); 						 // antaa kloonille (hp) id:n "hitpoint_" ja ajan millisekunteina
        setTimeout( function(){ hp.style.display = "none"}, 250); 			 // setTimeout kutsuu anonyymin funktion: eli (piilottaa hp:n, 250 ms kuluttua)
        document.body.appendChild(hp);  										//dokumenttiin lisätään uusi klooni hp
      
        hp.style.display = "block"; 										// displayaa hp:n, style eli ulkonäkö määritetty css:ssä
        hp.style.position = "absolute" 										// displayataan absoluuttisesti x:n ja y:n mukaan 
        hp.style.left = x + "px"
        hp.style.top = y  + "px"
        
        var shot = registerShot(x, y, ctime) 								//rekisteröi klikkauksen kordinaatit ja ajan
        var was_hit = checkTargetHit(shot)     						// tsekkaa osuiko targettiin
        console.log("was_hit: " + was_hit) 									//printtaa konsoliin "was_hit: " ja true tai false

		if (was_hit){
            shot.hit = true;
			correct_shots.push(shot)
        } else {
            shot.hit = false;
        }


		var k = correct_shots.length-1
        if (was_hit) {
			if (k == 0){
				points += 1;
			} 
 			else if (k >= 1){
				if (((correct_shots[k].t) - (correct_shots[k-1].t)) > correct_hit_interval ){
					points += 1;
				}
			} 
			showPoints()
            hp.style.background = "green"
            //thplayer.currentTime = 0.0 										//asettaa audioplayerin nollaan.
            //thplayer.play()  												//soittaa audioplayerista äänen että osuttiin oikeaan
        }

    }
}



function videoEnded(ev) {
	var temp_videoshots = []
	var line = ""
  	for (var i=0; i<shots.length; i++) {
		line = line + " "+ shots[i].x + "; " + shots[i].y + "; " + shots[i].t + "; " + shots[i].src + " \n"
		} 
	temp_videoshots.push(line)

    sessionStorage.setItem("videoshots_" + (clipset_pos+1), temp_videoshots)    //tekee sessionstorageen shotslistan nimeltä "videoshots_0"  jonka value on ekan videon shotit, sitten videoshots_1.....
        
	var video = document.getElementById("videoplayer")
    video.src = "" 
    clipset_pos += 1
    
    if (clipset_pos < clipset.length) {
		$("#klipinloppu").show();
    } else {
		$("#tasonloppu").show();
	}

	printToLog()

	sessionStorage.setItem("Points", points);

    saveShots();
}

function saveShots() {
    var gameshots_str = localStorage.getItem("gameshots");
    var gameshots = null;
    if (gameshots_str == null) {
        gameshots = {};
    } else {
        gameshots = JSON.parse(gameshots_str);
    }
    
    var player_id = sessionStorage.getItem("player_id");
    gameshots[player_id] = shots;  
    localStorage.setItem("gameshots", JSON.stringify(gameshots));
}


function submitData() {
    var req = XMLHttpRequest()

    //req.submittedData = "rairairairairai" //hit_data
    form_data = new FormData()
    console.log(hit_data.length)
    for (var i=0; i<hit_data.length; i++) { 
        
        var name = "hit" + (i + 1)
        var value = "" + hit_data[i][0] +","+ 
                         hit_data[i][1] +","+ 
                         hit_data[i][2]
        console.log(value)
        form_data.append(name, value)
    }
    req.open("POST", "http://localhost:8000/cgi-bin/save.py", true)
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    req.send(form_data)

}

function setPlayer(player_id) {
	sessionStorage.setItem("player_id", player_id); 

}

function showPoints() {  
	var current_points2 = document.getElementById("pisteruutu")
	current_points2.innerHTML="Pisteet: " + points;
	}

function showPointsBanner() {
	var current_points = document.getElementById("pisteet")
	var points_1 = sessionStorage.getItem("Points")
	if (points_1 == null) {
		current_points.innerHTML="Pisteet: 0";
		}
	else {
		current_points.innerHTML="Pisteet: " + points_1;
		};
	};

function printToLog() {            //printtaa konsoliin kaikki shotit jotka on shots-listalla
	console.log("tässä printToLogin outputti:")
	for (var j=0;j < shots.length; j++) {
		console.log(shots[j].x)
		console.log(shots[j].y)
		console.log(shots[j].t)
    };
};

function dataUlos() {
	var dataulos = document.getElementById("dataulos")

	for (var i=1; i<1000; i++) {
		var key = "videoshots_" + i;

		if (sessionStorage.getItem(key) == null){
			break; }
		else {
			dataulos.innerHTML += " \n Tässä videon " + i + " tiedot: \n \n" + sessionStorage.getItem(key)};
    };
};

function client2Rel(x, y) {
    var vplayer = document.getElementById("videoplayer");
    //console.log(x + " " + y + " " + vplayer.offsetLeft +" " + vplayer.offsetTop + " " + vplayer.offsetWidth + " " + vplayer.offsetHeight)
    var relx = (x - vplayer.offsetLeft) / vplayer.offsetWidth
    var rely = (y - vplayer.offsetTop) / vplayer.offsetHeight
    return [relx, rely]
}   

function rel2Video(relx, rely) {
    var vplayer = document.getElementById("videoplayer");
    var x = relx * vplayer.offsetWidth + vplayer.offsetLeft
    var y = rely * vplayer.offsetHeight + vplayer.offsetTop
    return [x, y]
}   


function video2rel(hpposX,hpposY){
    var vplayer = document.getElementById("videoplayer");
    var width= vplayer.offsetWidth;
    var height = vplayer.offsetHeight;
    var relativeY = hpposY/height;
    var relativeX = hpposX/width;
    
    //return "Relative height " +relativeH +" and relative width " +relativeW;
    return [relativeX, relativeY];
}

function rel2video(hprelX,hprelY){ 
    var vplayer = document.getElementById("videoplayer");
    var width=vplayer.offsetWidth;
    var height=vplayer.offsetHeight;
    var absoluteY = hprelY*height;
    var absoluteX = hprelX*width;
    
    //return "Absolute height " + absoluteH +" and absolute width " + absoluteW;
    return [absoluteX, absoluteY];
}
