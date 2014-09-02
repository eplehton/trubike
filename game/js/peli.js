function Shot(x, y, t, target_end_t, src) {
    this.t = t;
    this.x = x;
    this.y = y;
    this.target_end_t = target_end_t;
    this.src = src;
    this.date = new Date().toLocaleString();
    this.hit = null;
}

function Target(){
    this.id = Date.now();
    this.x = [];
    this.y = [];
    this.t = [];
    this.rel_width = 0.1;
    this.end_t = Infinity;
}


var points = 0;

var shots = [];
var game_points = new Map(); // for calculating points during a game

var check_missed_target_interval_size = 200;
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
    console.log('src ' + src);
    var clipname = src.split("/").pop();
    var src_trgs = all_targets[clipname];
    //console.log(src +" - "+ clipname + " - " + src_trgs);
    if (typeof src_trgs == "undefined") { // if empty
        src_trgs = [];
    }
    
    return src_trgs;
}

var clipset_num = 0; // which set
var clipset_pos = 0; // position within a set
var clipsets; // loaded in on ready

/*var clipset =  [ ["1", "../clips/jalankulkijat.mp4"],
                 ["2", "../clips/potkulautailija.mp4"] , 
                 ["3", "../clips/isoroba.mp4"], 
                 ["4", "../clips/jalankulkija_ja_suojatie.mp4" ] , 
                 ["5", "../clips/jalankulkijat2.mp4"], 
                 ["6", "../clips/vastaantulijat.mp4"], 
                 ["7", "../clips/ratikka.mp4"]];
*/
var correct_hit_interval = 2.5;
   
function checkTargetHit(shot){
    /*
        Return target if hitted, otherwise null.
    */
    
    var all_targets = loadLocalTargets(); // this should not be done everytime, cache
    var trgs = getSourceTargets(all_targets, shot.src);
	var hit_radius = 0.1;
    
	for (var i=0; i< trgs.length; i++) {
		var trg = trgs[i]; 
            
		var loc = findInsertIndex(trg.t, shot.t);
	    if ((loc > 0) && (shot.t < trg.end_t)) {
			loc = loc - 1; // set the right index to the target to be compared 
			console.log("shot: "+ shot.x + ","+ shot.y +" trg: "+ trg.x[loc] +","+ trg.y[loc]);
				
			var d2 = Math.sqrt(Math.pow(shot.x - trg.x[loc], 2) + Math.pow(shot.y - trg.y[loc], 2));
				
			if (d2 < (0.5*trg.rel_width)) {
				return trg;
			};
	    };
	};
    return null;
};

function acknowledgeMissedTarget() {
    var missed = document.getElementById("missed_target");
    missed.style.display = "none";
    
    var vplayer = document.getElementById("videoplayer");
    vplayer.play();
}

function handleMissedTarget(missed_trg) {
	var missed = document.getElementById("missed_target");
    var vplayer = document.getElementById("videoplayer");
	var missplayer = document.getElementById("missplayer");
	
	
	pauseVideo();
        
    var lastx = missed_trg.x.length-1;
    var relx = missed_trg.x[lastx];
    var rely = missed_trg.y[lastx];
    
    var clientCoords = rel2Client(relx, rely);
    var x = clientCoords[0];
    var y = clientCoords[1];
	
    
	var missed_width = vplayer.offsetWidth * missed_trg.rel_width;
    var missed_height = vplayer.offsetWidth * missed_trg.rel_width;
        
    var centering = [0.5 * missed_width, 
                     0.5 * missed_height];
    missed.style.left = (x - centering[0]) + "px";
    missed.style.top =  (y - centering[1]) + "px";

    missed.style.width = missed_width + "px";
    missed.style.height = missed_height + "px";

    missed.style.display = "block"; 								
    missed.style.position = "absolute";


    missplayer.play(); 

}


function loadClipsets() {
   
    $.getJSON('clipsets.js', function(data) {
        clipsets = data;
    });
}

function registerShot(x, y, t) {
    var src = clipsets[clipset_num][clipset_pos];
    var relCoords = client2Rel(x, y);

    //console.log("x=" + x + " y=" + y + " time=" + t + " src=" + src);
    //console.log("Suhteellinen sijainti: " + relCoords);
    //console.log("shot src is set to " + src);
    
    var shot = new Shot(relCoords[0], relCoords[1], t, null, src);
    shots.push(shot);
    return shot;
}

function startVideo() { 
    /* called in the beginning of the test */
    /* playing event (peli.html) is should be used to handle stuff which is related to 
    start of the playing, and this is called when a trial begins */
    var vplayer = document.getElementById("videoplayer");
    var width=vplayer.offsetWidth;
    var height=vplayer.offsetHeight;
    vplayer.src = clippath + clipsets[clipset_num][clipset_pos];
    vplayer.play();
    // correct_shots = [];  
    shots = [];				// tyhjentää shotslistan seuraavaa videota varten
    //console.log(height, width);


};

function checkMissedTargets(targets) {
    var vplayer = document.getElementById("videoplayer");
    var ctime = vplayer.currentTime;
    
    for (var tx=0; tx<targets.length; tx++) {
        var current_trg = targets[tx];
        // check if the target end was passed during the last interval without a shot
        if ((current_trg.end_t < ctime) & 
            (Math.abs(current_trg.end_t - ctime) < (check_missed_target_interval_size/1000))) {
            var hitted = false;
            for (var sx=shots.length-1; sx >= 0; sx--) {
                if (shots[sx].target_end_t == current_trg.end_t) {
                    hitted = true;
                    break;
                }
            }
            if (! hitted) {
                handleMissedTarget(current_trg);
            }
        }
    }
}

function pauseVideo() {
   var vplayer = document.getElementById("videoplayer");
   vplayer.pause();
}

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
        
        var centering = [0.5 * hp.offsetWidth, 
                         0.5 * hp.offsetHeight];
        hp.style.left = (x - centering[0]) + "px";
        hp.style.top =  (y - centering[1]) + "px";
        
        var shot = registerShot(x, y, ctime);
        //rekisteröi klikkauksen kordinaatit ja ajan
        var hitted_target = checkTargetHit(shot);     						// tsekkaa osuiko targettiin
         									//printtaa konsoliin "was_hit: " ja true tai false
        console.log("hitted_target: " + hitted_target);
		if (hitted_target != null){
            shot.hit = true;
            shot.target_end_t = hitted_target.end_t;
			game_points.set("" + hitted_target.end_t,  1);
        } else {
            shot.hit = false;
        }
		
		


        if (hitted_target != null) {

			var n = game_points.size;
			points = n;
			
			showPoints()
            hp.style.background = "green"
            thplayer.currentTime = 0.0 										//asettaa audioplayerin nollaan.
            thplayer.play()  												//soittaa audioplayerista äänen että osuttiin oikeaan
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
    
    if (clipset_pos < clipsets[clipset_num].length) {
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
    if (player_id == null) {
        alert("player_id is null, set to anonymous");
        player_id = "anonymous";
    }
	
	if (! gameshots.hasOwnProperty(player_id) )  {
		gameshots[player_id] = [];
	}
	
    gameshots[player_id].push(shots);  
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
    /* Client coordinatest to the relative. Useful for converting mouse click positions to rel coords.
    */
    var vplayer = document.getElementById("videoplayer");
    //console.log(x + " " + y + " " + vplayer.offsetLeft +" " + vplayer.offsetTop + " " + vplayer.offsetWidth + " " + vplayer.offsetHeight)
    var relx = (x - vplayer.offsetLeft) / vplayer.offsetWidth
    var rely = (y - vplayer.offsetTop) / vplayer.offsetHeight
    return [relx, rely]
}   

function rel2Client(relx, rely) {
    var vplayer = document.getElementById("videoplayer");
    var x = relx * vplayer.offsetWidth + vplayer.offsetLeft
    var y = rely * vplayer.offsetHeight + vplayer.offsetTop
    return [x, y]
}   


function video2Rel(hpposX,hpposY){
    var vplayer = document.getElementById("videoplayer");
    var width= vplayer.offsetWidth;
    var height = vplayer.offsetHeight;
    var relativeY = hpposY/height;
    var relativeX = hpposX/width;
    
    //return "Relative height " +relativeH +" and relative width " +relativeW;
    return [relativeX, relativeY];
}

function rel2Video(hprelX,hprelY){ 
    var vplayer = document.getElementById("videoplayer");
    var width=vplayer.offsetWidth;
    var height=vplayer.offsetHeight;
    var absoluteY = hprelY*height;
    var absoluteX = hprelX*width;
    
    //return "Absolute height " + absoluteH +" and absolute width " + absoluteW;
    return [absoluteX, absoluteY];
}
