function Shot(x, y, t, src, video_started_realt) {
	this.src = src; // clipname
	this.video_started_realt = video_started_realt; // real t when video started
	this.realt = Date.now(); // real t of shot
    this.t = t;  // video t
    this.x = x;  
    this.y = y;
	this.hit_target_id = -1;
	this.hit_target_loc = -1;
    this.target_end_t = null;
	this.target_loc = null;
    

    this.hit = false;
}

function Target(){
    this.id = Date.now();
    this.x = [];
    this.y = [];
    this.t = [];
    this.rel_width = 0.1;
	this.target_type = null;
	
}


var points = 0;

var shots = [];
var hitmiss = new Map();

var game_points = new Map(); // for calculating points during a game

var check_missed_target_interval_size = 50; // how often targets are checked for misses (ms)

var clipsets;
var clipset_num; // which set loaded from session storage in onready
var clipset_pos = 0; // position within a set


var video_started_realt; // used to group hits by clip presentation

var cached_targets = null;
var cached_current_targets = null;

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



function hideElementAfter(elem_id, timeout) {
	/*
		This function sets style.display = "none" to an element with an id elem_id after a timeout (ms).
		
		The point of using this function instead of directly setTimeout, is that the function 
		within the setTimeout gets evaluated with a correct elem_id. 
		This would be a problem in a loop where many elements are shown and set to hide with a direct timeout. 
	    In such a situation, the variable in the function definition inside the setTimetout would
		refer to the wrond elem_id (because it practically would always be referring to the last element of the loop when the 
		timeout would be executed).
		But number arguments to functions are always passed by value.  
	*/
	setTimeout( function(){ document.getElementById(elem_id).style.display = "none"}, timeout); 	
}
		
// Targets loading saving function


function loadLocalTargets() {
    // Load targets from JSON data stored on localstorage, from item "targets"
	var targets = null;
    var targets_s = localStorage.getItem("targets");
	
    try {
		targets = JSON.parse(targets_s);
    } catch(e1) { // if not available e.g. empty, make empty dict
		targets = {}
	}
    return targets;
}

function saveLocalTargets(all_targets) {
    // save targets to localStorage as JSON
    localStorage.setItem("targets", JSON.stringify(all_targets))
}


function loadTargetsFrom(json_file) { 
    
    $.getJSON(json_file, function(data) {
        cached_targets = data;
    });
	
}


function cacheCurrentTargets() {
	var vplayer = document.getElementById("videoplayer");
	var all_targets = getTargets();
	cached_current_targets = getSourceTargets(all_targets, vplayer.src);
}

function getSourceTargets(all_targets, src) {
    
    // Helper function to get an array of targets for the specific video
    // The file name of the clip is parsed, and is used as the key to pick the right targets, regardless of
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

function getTargets() {
	return cached_targets;
}



function checkTargetHit(shot){
    /*
	Check if a shot hitted any targets.
	Keeps track of hitted targets.
	Return info if hitted, otherwise empty
    */
    
	
    var trgs = cached_current_targets;
	
	var hit_target = []; // which targets are hitted
	var hit_loc = []; // the index location within each target
	var first_hit = []; // the first hit to the target or not
	
	for (var i=0; i< trgs.length; i++) {
		var trg = trgs[i]; 
            
		var loc = findInsertIndex(trg.t, shot.t);
	    if ((loc > 0) && (loc < trg.t.length)) {

			loc = loc - 1; // set the right index to the target to be compared 
			console.log("shot: "+ shot.x + ","+ shot.y +" trg: "+ trg.x[loc] +","+ trg.y[loc]);
				
			var d2 = Math.sqrt(Math.pow(shot.x - trg.x[loc], 2) + Math.pow(shot.y - trg.y[loc], 2));
				
			if (d2 < (0.5*trg.rel_width)) {
				
				// It's a hit
				// modify shot properties
				shot.hit_target_id = trg.id;
				shot.hit_target_loc = loc;
				
				// keep track of hitted and missed targets (for the program and for the ease of analysis
				hit_target.push(trg);
				hit_loc.push(loc);
				
				if (! hitmiss.has(trg.id)) { // mark the FIRST shot as hitted
					hitmiss.set(trg.id, {
										src : shot.src,
										video_started_realt : video_started_realt,
										target_id : trg.id,
										target_loc : loc,
										hit_realt : shot.realt,
										hit_t : shot.t,
										miss_realt : -1,
										miss_t : -1,
										hit: true,
										ack_realt: -1});
					first_hit.push(true);
				} else {
					first_hit.push(false);
				}
			};
	    };
	};
	return {target: hit_target, location: hit_loc, first_hit: first_hit};
};

function acknowledgeMissedTarget(ev) {
	console.log("acknowledgeMissedTarget called");

	var x = ev.clientX;
	var y = ev.clientY;
	
    var missed = document.getElementById("missed_target");
    missed.style.display = "none";
    
	// register the acknowledgement time 
	var missed_id = missed._trubike_missed_target.id;
	
	var mt = hitmiss.get(missed_id)
	mt.ack_realt = Date.now(); 

	
	showShot(x, y, missed._trubike_missed_target);
	
    var vplayer = document.getElementById("videoplayer");
	
	if (vplayer.currentTime > (vplayer.duration - 1)) {
		videoEnded();
	} else {
	
		vplayer.play();
	}
}

function handleMissedTarget(missed_trg) {
   									
	
	var missed = document.getElementById("missed_target");
    var vplayer = document.getElementById("videoplayer");
    var missplayer = document.getElementById("missplayer");
	
    pauseVideo();
	console.log("pause video at ", vplayer.currentTime, " due to target at ", missed_trg.t.slice(-1).pop());

									
									
	
    var lastx = missed_trg.x.length-1;
    var relx = missed_trg.x[lastx];
    var rely = missed_trg.y[lastx];
    
    var clientCoords = rel2Client(vplayer, relx, rely);
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


    var search_version = sessionStorage.getItem("search_version");
    if (search_version == "search") {
		missed.style.opacity = 0.0;
    } else {
		missed.style.opacity = 1.0;
    }
	
	// occlusions
	if (missed_trg.target_type == 'occlusion')  {
		missed.style.borderRadius = "0%";
	} else {
		missed.style.borderRadius = "50%";	
	}
	
    missed.style.position = "absolute";
    missed.style.display = "block"; 
    missed._trubike_missed_target = missed_trg; 	

    missplayer.play(); 

}




function registerShot(x, y, t) {
    var src = clipsets[clipset_num][clipset_pos];
    var relCoords = client2Rel(x, y);

    //console.log("x=" + x + " y=" + y + " time=" + t + " src=" + src);
    //console.log("Suhteellinen sijainti: " + relCoords);
    //console.log("shot src is set to " + src);
	
	var target_end_t = null;
    
    var shot = new Shot(relCoords[0], relCoords[1], t, src, video_started_realt);
	
    shots.push(shot);
    return shot;
}


function startVideo() { 
    /* called in the beginning of the test */
    /* playing event (peli.html) is should be used to handle stuff which is related to 
    start of the playing, and this is called when a trial begins */
        
	
	
	
	
	var vplayer = document.getElementById("videoplayer");
    vplayer.src = clippath + clipsets[clipset_num][clipset_pos];
    
	cacheCurrentTargets();
	
	
    shots = [];				// tyhjentää shotslistan
    hitmiss = new Map();
	
    video_started_realt = Date.now(); // this is used to group shots per clip presentation

	vplayer.play();
    
};

function checkMissedTargets() {
    var vplayer = document.getElementById("videoplayer");
    var ctime = vplayer.currentTime;
	var targets = cached_current_targets; 
	var video_src = vplayer.src;
	
    for (var tx=0; tx<targets.length; tx++) {
        var trg = targets[tx];
        // check if the target end is passed and the target has not been hit yet
		var end_t = trg.t.slice(-1).pop();
		var id = trg.id;
		
        if ((end_t < ctime) & (! hitmiss.has(id))) {
            var hitted = false;
            for (var sx=shots.length-1; sx >= 0; sx--) {
                if (shots[sx].target_end_t == end_t) {
                    hitted = true;
                    break;
                }
            }
            if (! hitted) {
				// keep track of hitted and missed
				hitmiss.set(trg.id, {
									src : video_src,
									video_started_realt : video_started_realt,
									target_id : trg.id,
									target_loc : -1,
									hit_realt : -1,
									hit_t : -1,
									miss_realt : Date.now(),
									miss_t : ctime,
									hit: false,
									ack_realt: -1});
		
	
				
				console.log("will call handleMissedTarget at ", ctime, " due to target at ", end_t);
                handleMissedTarget(trg);
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
    var ctime = vplayer.currentTime;
	var hitted = document.getElementById("hitted_target");
    
	if (ctime > 0.0) {
        var x = ev.clientX;
        var y = ev.clientY;
        
        
		// register the shot
        var shot = registerShot(x, y, ctime);
        
        var hit = checkTargetHit(shot); // check if any targets has been hit
        console.log("hitted target: " + hit);
		    
		for (var h=0; h<hit.target.length; h++) {	
			
			/* move modification of shot properties regarding hits to checkTargetHit
			shot.hit = true;
            shot.target_end_t = hit.target[h].t.slice(-1).pop();
			shot.target_loc = hit.location[h];
			*/
			// keep track of hitted targets and points
			// for updating the points
			game_points.set("" + hit.target[h].t.slice(-1).pop(),  1) //{target: hit_target, location: hit_loc};);
		
			showShot(x, y, hit.target[h]);

			
			// show points
			if (hit.first_hit[h]) {
				var point_tmpl = document.getElementById("point_tmpl"); 		
				var pnt = point_tmpl.cloneNode(true);										
				var pnt_id = "point_" + Date.now(); 
				pnt.id = pnt_id;

				hideElementAfter(pnt_id, 250)
				
				document.body.appendChild(pnt);  										
				
				
				pnt.style.display = "block";					
				pnt.style.position = "absolute";
			
				
				var client_coords = rel2Client(vplayer, 
											   hit.target[h].x[hit.location[h]], 
											   hit.target[h].y[hit.location[h]]);
				var hitted_x = client_coords[0];
				var hitted_y = client_coords[1];
				var centering = [0.5 * pnt.offsetWidth, 
								 0.5 * pnt.offsetHeight];
				//  - centering[0] - centering[1]
				pnt.style.left = (hitted_x) + "px";
				pnt.style.top =  (hitted_y - 100) + "px";
				console.log("point coords: " + hitted_x + " - " + hitted_y);	
			
				// increase also game points count
				points += 1;
			}
		}	
		

		if (hit.target.length == 0) {
			showShot(x, y, null);
		}
		

	}
}

function showShot(x, y, hitted_target) {
	
	var thplayer = document.getElementById("targethitplayer");
	
	// shot feedback
	var hp_tmpl = document.getElementById("hitpoint_tmpl"); 	// etsii hitpoint_tmpl nimisen divin html-tiedostosta
	var hp = hp_tmpl.cloneNode();								// kloonaa sen
	hp.id = "hitpoint_" + Date.now(); 						 	// antaa kloonille (hp) id:n "hitpoint_" ja ajan millisekunteina
	setTimeout( function(){ hp.style.display = "none"}, 250); 	// setTimeout kutsuu anonyymin funktion: eli (piilottaa hp:n, 250 ms kuluttua)
	document.body.appendChild(hp);  							// dokumenttiin lisätään uusi klooni hp
	
	hp.style.display = "block"; 								// displayaa hp:n, style eli ulkonäkö määritetty css:ssä
	hp.style.position = "absolute" 								// displayataan absoluuttisesti x:n ja y:n mukaan 
	
	// show the hit point as green and play hit audio
	if (hitted_target != null) {
		hp.style.background = "green"; 
		hp.style.width = "8em";
		hp.style.height = "8em";
		
		// update points and play the audio
		showPoints()
		thplayer.currentTime = 0.0 								// asettaa audioplayerin nollaan.
		thplayer.play()  										// soittaa audioplayerista äänen että osuttiin oikeaan
	
		if (hitted_target.target_type == 'occlusion') {
			hp.style.borderRadius = "0%";
		} else {
			hp.style.borderRadius = "50%";
		}
		
	} 
	
	
	
	var centering = [0.5 * hp.offsetWidth, 
					 0.5 * hp.offsetHeight];
	hp.style.left = (x - centering[0]) + "px";
	hp.style.top =  (y - centering[1]) + "px";
}

/* 		// show the hit point as green and play hit audio
		if (hit.target.length > 0) {

			hp.style.background = "green"; 
			hp.style.width = "8em";
			hp.style.height = "8em";

			var centering = [0.5 * hp.offsetWidth, 
							 0.5 * hp.offsetHeight];
			hp.style.left = (x - centering[0]) + "px";
			hp.style.top =  (y - centering[1]) + "px";
			
			// update points and play the audio
			showPoints()
			thplayer.currentTime = 0.0 										//asettaa audioplayerin nollaan.
			thplayer.play()  								//soittaa audioplayerista äänen että osuttiin oikeaan
		} else  {
			
			var centering = [0.5 * hp.offsetWidth, 
							 0.5 * hp.offsetHeight];
			hp.style.left = (x - centering[0]) + "px";
			hp.style.top =  (y - centering[1]) + "px";
			
		}
    } 
*/



function videoEnded(ev) {
	console.log("videoEnded called");
	
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
	
	var clip_counter = document.getElementById("clip_counter");
	var clip_id = "" + clipsets[clipset_num][clipset_pos].substring(0, 3);
	var clip_n = clipsets[clipset_num].length;
	
	var txt = (clipset_pos + 1) + "/"+ clip_n + " (" + clip_id + ")"; 
	
	clip_counter.innerHTML = txt;

	sessionStorage.setItem("Points", points);
    saveGameStats();	
}

function saveGameStats() {
	var shot_stats_key = "trubike.game.shot_stats";
	var hitmiss_stats_key = "trubike.game.hitmiss_stats";
	
    var player_id = sessionStorage.getItem("player_id");
    if (player_id == null) {
        alert("player_id is null, set to anonymous");
        player_id = "anonymous";
    }
	
	// shots
	var shots_stats_str = localStorage.getItem(shot_stats_key);
    var shots_stats = null;
    if (shots_stats_str == null) {
        shots_stats = {};
    } else {
        shots_stats = JSON.parse(shots_stats_str);
    }
	//console.log("shots_stats recovered as ", shots_stats);
	
	if (! shots_stats.hasOwnProperty(player_id) )  {
		shots_stats[player_id] = [];
	}
	
    shots_stats[player_id].push(shots); 
	
	localStorage.setItem(shot_stats_key, JSON.stringify(shots_stats));
	
	// hitmiss
    var hitmiss_stats_str = localStorage.getItem(hitmiss_stats_key);
    var hitmiss_stats = null;
    if (hitmiss_stats_str == null) {
        hitmiss_stats = {};
    } else {
        hitmiss_stats = JSON.parse(hitmiss_stats_str);
    }

	//console.log("hitmiss_stats recovered as ", hitmiss_stats);    
    
	
	if (! hitmiss_stats.hasOwnProperty(player_id) )  {
		hitmiss_stats[player_id] = [];
	}
	
	
    // convert Maps to something easier to json, actually, just the values...
    var hitmiss_lst = []; 
    for (v of hitmiss.values()) { // we don't need the keys, because the key is included in the value object
        hitmiss_lst.push(v);
    }
    
    hitmiss_stats[player_id].push(hitmiss_lst); 
	
    localStorage.setItem(hitmiss_stats_key, JSON.stringify(hitmiss_stats));
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

function rel2Client(videoplayer, relx, rely) {
    var x = relx * videoplayer.offsetWidth + videoplayer.offsetLeft
    var y = rely * videoplayer.offsetHeight + videoplayer.offsetTop
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


function setupGameInteraction() {
		
	
	$("#instructionplayer").on("ended", function() {
		
		var instr = document.getElementById("instruction");
		instr.innerHTML = "<p>Klikkaa aloittaaksesi pelin!</p>";
		
		
		$("#instruction").click(function(){ /* kun alun ohjeruutua klikkaa, soitetaan eka video ja piilotetaan ohjeruutu */
   		    var instr = document.getElementById("instruction");
		    instr.style.display = "none"; 
		    startVideo();
		});
	    });
	
	
	    
	
	$("#klipinloppu").click(function(){/* kun klipinloppua klikkaa, soitetaan seuraava video ja piilotetaan klipinloppu-ruutu */		
		var elem = document.getElementById("klipinloppu");
		elem.style.display = "none"; 
		startVideo();		
	});
	
	$("#tasonloppu").click(function(){ /* kun klipinloppua klikkaa, soitetaan seuraava video ja piilotetaan klipinloppu-ruutu */		
		document.location.href = '../index.html';		
	});
	
	// set check for missed targets
	var vplayer = document.getElementById("videoplayer");
	var check_missed_targets_interval_id = null;
	
	vplayer.addEventListener("playing", function() {
		if (check_missed_targets_interval_id == null) { // do not make duplicates
			check_missed_targets_interval_id = setInterval( function(){ checkMissedTargets() },
																	    check_missed_target_interval_size); 
			}
	});

	vplayer.addEventListener("pause", function() {
		clearInterval(check_missed_targets_interval_id);
		check_missed_targets_interval_id = null;
	});
	
	
	 // Keypresses
	$(document).keypress(function(event){
		switch (event.which) {
			case "a".charCodeAt(0):
				var cp = clipset_pos - 1;
				videoEnded();
				clipset_pos = cp;
			
				break;
			case "z".charCodeAt(0):
				var cp = clipset_pos + 1;
				videoEnded();
				clipset_pos = cp;
			
				break;
			case 'f'.charCodeAt(0):
				 var fv = sessionStorage.getItem("search_version");
				 var f = "";
				 if (fv == 'nosearch') {
					f = "search";
				} else {
					f = "nosearch";
				}
				sessionStorage.setItem("search_version", f);
				alert("Search set to " + f);
				break;
		}
	});
	
	
			var instrplayer = document.getElementById("instructionplayer");

    var src = "media/game_starts_show.wav"
    if (sessionStorage.getItem("search_version") == 'search') {
	src = "media/game_starts_search.wav"	
    }
    instrplayer.src = src;
    instrplayer.play();
}
	
	