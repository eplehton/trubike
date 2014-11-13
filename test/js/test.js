
var local_storage_targets = "targets";

var query_id = -1;
var test_clips = ['../clips/157_isoroba.mp4', 
                    '../clips/157_isoroba.mp4'];
var test_stop_times = [2000, 3200];

var test_queries = [ [["pedestrian", 100, 300],
                 ["car", 370, 400]],
                [["pedestrian", 100, 300],  
                 ["car", 370, 400]]]


var test_queries = [ 	{clip : '../clips/157_isoroba.mp4',
						 stop_time : 2000,
						 queries : [["pedestrian", 100, 300]]},
						{clip : '../clips/157_isoroba.mp4',
						 stop_time : 3000,
						 items : [["nothing", 500, 300],
								    ["car", 300, 700]]} ];


var test_answers = [];

var clippath = "../clips_test/";

var clipsets = [[
"101t_arkadiankatu.mp4",
"118t_suojatie_ja_risteys.mp4",
"120t_jalankulkijalapset.mp4",
"121t_kaantyva_auto.mp4",
"122t_sturenkatu_bussikatos.NE.mp4",
"124t_alppila_jalankulkija_pyoratie.mp4",
"125t_hameentie2.mp4",
"129t_lansipasila.NE.mp4",
"136t_pasilanasema.mp4",
"137t_pyorailija_oikealta.mp4",
"138t_sturenkatu2.mp4",
"144t_itapasila.mp4",
"146t_itapasila3.mp4",
"149t_jalankulkija.mp4",
"150t_kaantyva_auto.mp4"
]];
									
function  annoTargets2TestQuery(clipname, all_targets) {
	var cur_trgs = all_targets[clipname];
	
	if (cur_trgs[0] === undefined) {
		alert("No targets with clipname: " + clipname);
	}
	
	var stop_time = cur_trgs[0].t.slice(-1).pop();
	
	
	var query = {clip : clipname, stop_time : stop_time, items : []};
	
	for (var i=0; i<cur_trgs.length; i++) {
		var ct = cur_trgs[i];
		
		console.log(ct.t);
		if (stop_time.toFixed(1) !== ct.t.slice(-1).pop().toFixed(1)) {
			alert("annoTargets2TestQuery receives anno targets with varying last t. Sorry, but it cannot understand what to do now.");
		} else {
			
			query.items.push( [ct.target_type, ct.x[0], ct.y[0]] ); 
		}
		
	}
	console.log('query', query);
	
	return query;
}


function loadTargets() {
    // Load targets from JSON data stored on localstorage, from item "targets"
    var targets = null;
    //var targets_s = localStorage.getItem(local_storage_targets);
	
    try {
		targets = JSON.parse(annotations);
    } catch(e1) { // if not available e.g. empty, make empty dict
		targets = {}
	}
    return targets;
}


function loadQueries() {
	var all_targets = loadTargets();
	var cliplist = clipsets[0];
	console.log('cliplist', cliplist);
	
	var test_queries = [];
	
	for (var i=0; i<cliplist.length; i++) {
		var clipname = cliplist[i];

	
		var query = annoTargets2TestQuery(clipname, all_targets);
		console.log('query', query)
		test_queries.push(query);
	}
	return test_queries;
}
	



function proceedIfAllAnswered(query_banner) {
	/*
		If the query banner do not have any visible query boxes == all answered, then proceed to the next test clip.
	*/
	
	var query_boxes = query_banner.getElementsByClassName("query_box");
	var all_answered = true;
	
	for (var i=0; i<query_boxes.length; i++) {
		var qbox = query_boxes.item(i);
		if (qbox.style.display == "block") {
			all_answered = false;
			break;
		}
	}
	
	console.log('all_answered' + all_answered);
		
	if (all_answered) {
		
		// saveTestAnswers();
		
				
		
		query_banner.style.display = "none";
		startNextClip();
		console.log("rai");
	}
}
	
function registerAnswer(query_id, box_id, answer, query_started_realt) {
	var query_box_id = "query_box_" + query_id + '_' + box_id;
	console.log(query_box_id);
	
	var qbox = document.getElementById(query_box_id);
	qbox.style.display = "none";
	
	var player_id = localStorage.getItem("player_id");
	
	var answer_latency = (Date.now() - query_started_realt) / 1000;
	
	var answer = { player_id : player_id,
				   query_id : query_id,
				   query_started_realt : query_started_realt,
				   answer_latency : answer_latency,
				   answer : answer};
				   
	test_answers.push(answer);
	
}


function rel2Client(videoplayer, relx, rely) {
	/*
		Converts video relative coordinates to client coordinates.
		Should this be in a common library?
	*/
    var x = relx * videoplayer.offsetWidth + videoplayer.offsetLeft
    var y = rely * videoplayer.offsetHeight + videoplayer.offsetTop
    return [x, y]
}   


function showQuery(query_items) {	
	
	var vplayer = document.getElementById("videoplayer");

	var qbanner = document.getElementById("query_banner");
	var qbt = document.getElementById("query_box_template");

	qbanner.style.display = "block";
	vplayer.pause();
		
	for (var box_id=0; box_id<query_items.length; box_id++) {
		var query_box_id = "query_box_" + query_id + '_' + box_id;

		var qbox = qbt.cloneNode(true);
		qbox.id = query_box_id;


		var pedestrian = qbox.getElementsByClassName("pedestrian").item(0);
		var bicycle = qbox.getElementsByClassName("bicycle").item(0);
		var car = qbox.getElementsByClassName("car").item(0);
		var nothing = qbox.getElementsByClassName("nothing").item(0);
		
		var query_started_rt = Date.now();
		
		function makeCallback(q_id, b_id, ans, qs_rt) {
			return function() { registerAnswer(q_id, b_id, ans, qs_rt); } 
		}
		
		pedestrian.addEventListener("click", makeCallback(query_id, box_id, "pedestrian", query_started_rt), false);
		bicycle.addEventListener("click", makeCallback(query_id, box_id, "bicycle", query_started_rt), false);
		car.addEventListener("click", makeCallback(query_id, box_id, "car", query_started_rt), false);
		nothing.addEventListener("click", makeCallback(query_id, box_id, "nothing", query_started_rt), false);
		
		qbox.addEventListener("click", function() { proceedIfAllAnswered(qbanner); }, false);

		qbanner.appendChild(qbox);  
		qbox.style.display = "block";
		
		var clientxy = rel2Client(vplayer, query_items[box_id][1], query_items[box_id][2]);
		var centering =	[qbox.offsetWidth * 0.5, qbox.offsetHeight * 0.5];
		
		
		qbox.style.top = (clientxy[1] - centering[1]) + "px"; 
		qbox.style.left = (clientxy[0] - centering[0]) + "px";
		

	}
}

function saveTestAnswers() {	
	var player_id = localStorage.getItem("player_id");
	var local_answers_str = localStorage.getItem("trubike.test.answers");

	var local_answers = null;
	try {
		local_answers = JSON.parse(local_answers_str);
	} catch (e) {
		local_answers = {};
	}
    var player_id = "anonymous";
	local_answers[player_id] = test_answers;

}
	 


function startNextClip() {
	
	query_id += 1;
	
	if (query_id == 0) {
		test_queries = loadQueries();
	}
	
	console.log('test_queries', test_queries);
	
	if (query_id < test_queries.length) {
		var query = test_queries[query_id];

		var vplayer = document.getElementById("videoplayer");
		vplayer.src = clippath + query.clip
		console.log("vplayer.src", vplayer.src);
		vplayer.play();
		
		setTimeout(function() { showQuery(query.items); }, query.stop_time * 1000);
	} else {
		alert("Ready!");
	}
}

