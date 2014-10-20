function Shot(x, y, t, src, video_started_t) {
	this.video_started_t = video_started_t;
    this.t = t;
    this.x = x;
    this.y = y;
    this.target_end_t = null;
	this.target_loc = null;
    this.src = src;
    this.realt = Date.now();
    this.hit = false;
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
var hitmiss = new Map();

var game_points = new Map(); // for calculating points during a game

var check_missed_target_interval_size = 200; // how often targets are checked for misses (ms)

var clipsets; //included as a .js-file
var clipset_num; // which set loaded from session storage in onready
var clipset_pos = 0; // position within a set

var correct_hit_interval = 2.5;
var video_started_t; // used to group hits by clip presentation


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
		
// Targets loading saving functions


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





function checkTargetHit(shot){
    /*
	Check if a shot hitted any targets.
	Keeps track of hitted targets.
	Return info if hitted, otherwise empty
    */
    
    var all_targets = loadLocalTargets(); // this should not be done everytime, cache
    var trgs = getSourceTargets(all_targets, shot.src);
	    
	var hit_target = []; // which targets are hitted
	var hit_loc = []; // the index location within each target
	var first_hit = []; // the first hit to the target or not
	
	for (var i=0; i< trgs.length; i++) {
		var trg = trgs[i]; 
            
		var loc = findInsertIndex(trg.t, shot.t);
	    if ((loc > 0) && (shot.t < trg.end_t)) {
			loc = loc - 1; // set the right index to the target to be compared 
			console.log("shot: "+ shot.x + ","+ shot.y +" trg: "+ trg.x[loc] +","+ trg.y[loc]);
				
			var d2 = Math.sqrt(Math.pow(shot.x - trg.x[loc], 2) + Math.pow(shot.y - trg.y[loc], 2));
				
			if (d2 < (0.5*trg.rel_width)) {
				hit_target.push(trg);
				hit_loc.push(loc);
				
				if (! hitmiss.has(trg.end_t)) { // mark the FIRST shot as hitted
					hitmiss.set(trg.end_t, {hitmiss_realt: shot.realt,
												target_end_t: trg.end_t,
												hit: true,
												shot_t: shot.t,
												location: loc,
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

function acknowledgeMissedTarget() {
    var missed = document.getElementById("missed_target");
    missed.style.display = "none";
    
	// register the acknowledgement time 
	var missed_end_t = missed._trubike_missed_end_t;
	var mt = hitmiss.get(missed_end_t)
	mt.ack_realt = Date.now(); 
	
    var vplayer = document.getElementById("videoplayer");
    vplayer.play();
}

function handleMissedTarget(missed_trg) {
    var missed = document.getElementById("missed_target");
    var vplayer = document.getElementById("videoplayer");
    var missplayer = document.getElementById("missplayer");
	
    pauseVideo();
        

	hitmiss.set(missed_trg.end_t, {hitmiss_realt: Date.now(),
									hit: false,
									target_end_t: missed_trg.end_t,
									shot_t: -1,
									location: -1,
									ack_realt: -1});
	
	
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


    var feedback_version = sessionStorage.getItem("feedback_version");
    if (feedback_version == "nohighlight") {
		missed.style.opacity = 0.0;
    } else {
		missed.style.opacity = 1.0;
    }
	
    missed.style.position = "absolute";
    missed.style.display = "block"; 
    missed._trubike_missed_end_t = missed_trg.end_t;	

    missplayer.play(); 

}


function loadClipsets() { // not used because ajax calls with local files do not work always
   
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
	
	var target_end_t = null;
    
    var shot = new Shot(relCoords[0], relCoords[1], t, src, video_started_t);
	
    shots.push(shot);
    return shot;
}


function startVideo() { 
    /* called in the beginning of the test */
    /* playing event (peli.html) is should be used to handle stuff which is related to 
    start of the playing, and this is called when a trial begins */
    var vplayer = document.getElementById("videoplayer");
    vplayer.src = clippath + clipsets[clipset_num][clipset_pos];
    vplayer.play();
    // correct_shots = [];  
	
    shots = [];				// tyhjentää shotslistan
    hitmiss = new Map();
	
    video_started_t = Date.now(); // this is used to group shots per clip presentation

};

function checkMissedTargets(targets) {
    var vplayer = document.getElementById("videoplayer");
    var ctime = vplayer.currentTime;
    
    for (var tx=0; tx<targets.length; tx++) {
        var current_trg = targets[tx];
        // check if the target end is passed and the target has not been hit yet
        if ((current_trg.end_t < ctime) & (! hitmiss.has(current_trg.end_t))) {
            var hitted = false;
            for (var sx=shots.length-1; sx >= 0; sx--) {
                if (shots[sx].target_end_t == current_trg.end_t) {
                    hitted = true;
                    break;
                }
            }
            if (! hitted) {
				console.log(current_trg);
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
	var hitted = document.getElementById("hitted_target");
    
	if (ctime > 0.0) {
        var x = ev.clientX;
        var y = ev.clientY;
        
        
		// register the shot
        var shot = registerShot(x, y, ctime);
        
        var hit = checkTargetHit(shot); // check if any targets has been hit
        console.log("hitted_target: " + hit);
		    
		for (var h=0; h<hit.target.length; h++) {	
			shot.hit = true;
            shot.target_end_t = hit.target[h].end_t;
			shot.target_loc = hit.location[h];
			
			// keep track of hitted targets and points
			// for updating the points
			game_points.set("" + hit.target[h].end_t,  1) //{target: hit_target, location: hit_loc};);
			points += 1; //game_points.size;
		
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
			
				
				var client_coords = rel2Client(hit.target[h].x[hit.location[h]], 
											   hit.target[h].y[hit.location[h]]);
				var hitted_x = client_coords[0];
				var hitted_y = client_coords[1];
				var centering = [0.5 * pnt.offsetWidth, 
								 0.5 * pnt.offsetHeight];
				//  - centering[0] - centering[1]
				pnt.style.left = (hitted_x) + "px";
				pnt.style.top =  (hitted_y - 100) + "px";
				console.log("point coords: " + hitted_x + " - " + hitted_y);	
			}


			/*
			var client_coords = rel2Client(hit.target.x[hit.location], 
										   hit.target.y[hit.location]);
			var hitted_x = client_coords[0];
			var hitted_y = client_coords[1];
			var hitted_width = vplayer.offsetWidth * hit.target.rel_width;
			var hitted_height = vplayer.offsetWidth * hit.target.rel_width;
			
			hitted.style.left = (hitted_x - 0.5*hitted_width) + "px";
			hitted.style.top =  (hitted_y - 0.5*hitted_height) + "px";

			hitted.style.width = hitted_width + "px";
			hitted.style.height = hitted_height + "px";

			hitted.style.display = "block"; 								
			hitted.style.position = "absolute";
			setTimeout( function(){ hitted.style.display = "none"}, 250); // hide it soon
			 */
		}	

		// shot feedback
		var hp_tmpl = document.getElementById("hitpoint_tmpl"); 				//etsii hitpoint_tmpl nimisen divin html-tiedostosta
        var hp = hp_tmpl.cloneNode();										//kloonaa sen
        hp.id = "hitpoint_" + Math.round(ctime*1000); 						 // antaa kloonille (hp) id:n "hitpoint_" ja ajan millisekunteina
        setTimeout( function(){ hp.style.display = "none"}, 250); 			 // setTimeout kutsuu anonyymin funktion: eli (piilottaa hp:n, 250 ms kuluttua)
        document.body.appendChild(hp);  										//dokumenttiin lisätään uusi klooni hp
		
        hp.style.display = "block"; 										// displayaa hp:n, style eli ulkonäkö määritetty css:ssä
        hp.style.position = "absolute" 										// displayataan absoluuttisesti x:n ja y:n mukaan 
        

		
		// show the hit point as green and play hit audio
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

    saveStats();
	alert(clipsets[clipset_num][clipset_pos].substring(0, 3));
}

function saveStats() {
    var shots_stats_str = localStorage.getItem("shots_stats");
    var shots_stats = null;
    if (shots_stats_str == null) {
        shots_stats = {};
    } else {
        shots_stats = JSON.parse(shots_stats_str);
    }


    var hitmiss_stats_str = localStorage.getItem("hitmiss_stats");
    var hitmiss_stats = null;
    if (hitmiss_stats_str == null) {
        hitmiss_stats = {};
    } else {
        hitmiss_stats = JSON.parse(hitmiss_stats_str);
    }

    
    var player_id = sessionStorage.getItem("player_id");
    if (player_id == null) {
        alert("player_id is null, set to anonymous");
        player_id = "anonymous";
    }
	
	if (! shots_stats.hasOwnProperty(player_id) )  {
		shots_stats[player_id] = [];
	}
	
	if (! hitmiss_stats.hasOwnProperty(player_id) )  {
		hitmiss_stats[player_id] = [];
	}
	
    shots_stats[player_id].push(shots); // concat would be nicer
	
    // convert Maps to something easier to json, actually, just the the values...
    var hitmiss_lst = []; 
    for (v of hitmiss.values()) { // we don't need the keys, because the key is included in the value object
        hitmiss_lst.push(v);
    }
    
    hitmiss_stats[player_id].push(hitmiss_lst);  // concat would be nicer
	
    localStorage.setItem("shot_stats", JSON.stringify(shots_stats));
	localStorage.setItem("hitmiss_stats", JSON.stringify(hitmiss_stats));
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
