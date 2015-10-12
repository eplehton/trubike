function Shot(x, y, t, src, video_started_realt) {
	this.src = src; // clipname
	this.video_started_realt = video_started_realt; // real t when video started
	this.realt = Date.now(); // real t of shot
    this.t = t;  // video t
    this.x = x;  
    this.y = y;
	this.hit_target_id = -1;
	this.hit_target_loc = -1;
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


function client2Rel(videoplayer, x, y) {
    /* Client coordinates (mouse coordinates) to relative video cordinates. */
    var relx = (x - videoplayer.offsetLeft) / videoplayer.offsetWidth
    var rely = (y - videoplayer.offsetTop) / videoplayer.offsetHeight
    return [relx, rely]
}   

function rel2Client(videoplayer, relx, rely) {
    /* Relative video coordinates to client coordinates (mouse coordinates). */
    var x = relx * videoplayer.offsetWidth + videoplayer.offsetLeft
    var y = rely * videoplayer.offsetHeight + videoplayer.offsetTop
    return [x, y]
}   


function loadTargetsJSON(json_file) {
    $.getJSON(json_file, function(data) {
        cached_targets = data;
    });
}


function loadTargetsFromLocalStorage() {
    // Annotation tool uses this
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

function saveTargetsToLocalStorage(all_targets) {
    // Annotation tool uses this
    // save targets to localStorage as JSON
    // backup first...
    localStorage.setItem("targets_bak", localStorage.getItem("targets"));
    // then save
    localStorage.setItem("targets", JSON.stringify(all_targets));
}
