
var local_storage_targets = "targets";
var cached_targets = null;


var query_id = -1;
var query_box_present_color = 'green';
var query_started_realt = null; // global var which is used when registering not presence (should be something neater...)


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
				"154t_leikattu.mp4",
				"112t_mikonkatu.mp4",
				"1t_paaty.mp4", // NE
				"101t_arkadiankatu.mp4",
				"156t_edesta_vas.kaantyva_auto.mp4",     // NE
				"142t_auto_tiella.mp4",
				"157t_isoroba.mp4",
				"139t_sturenkatu_talonkulma.NE.mp4",    // NE
				"158t_jalankulkija_ja_suojatie.mp4",			
				"144t_itapasila.mp4",
				"102t_bussi.risteys.mp4",
				],
									
				["117t_suojatie.mp4",	
				"122t_sturenkatu_bussikatos.NE.mp4",  // NE
				"131t_lastenvaunut.mp4",
				"140t_suojatieneteen_pysahtynyt_kuormaauto.mp4",
				"114t_Rautatieasema.mp4",
				"129t_lansipasila.NE.mp4", // NE				
				"121t_kaantyva_auto.mp4",
				"125t_hameentie2.mp4"], 
				
				["137t_pyorailija_oikealta.mp4",
				"105t_kaantyva_auto.mp4",
				"138t_sturenkatu2.mp4",
				"135t_paaskylanrinne.NE.mp4",    // NE
				"108t_karkikolmio.mp4",
				"133t_mansku_pysakoituauto.NE.mp4",  // NE
				"149t_jalankulkija.mp4",
				"124t_alppila_jalankulkija_pyoratie.mp4"
				]];


/*
"130t_lapset.mp4",
"131t_lastenvaunut.mp4",
"132t_leikkipuisto.mp4",
"133t_mansku_pysakoituauto.NE.mp4",
"135t_paaskylanrinne.NE.mp4",
"139t_sturenkatu_talonkulma.NE.mp4",
"140t_suojatieneteen_pysahtynyt_kuormaauto.mp4",
"142t_auto_tiella.mp4",
"143t_hameentie.mp4",
"151t_keskuspuisto.mp4",
"153t_pasila.mp4",
"154_leikattu.mp4",
"154_somerontie.mp4",
"154t_autot_jalankulkijat_pyorailija.mp4",
"156t_edesta_vas.kaantyva_auto.mp4",
"157t_isoroba.mp4",
"158t_jalankulkija_ja_suojatie.mp4",
"159t_jalankulkija_porttikongi.mp4"
*/

function annoTargets2TestQuery(clipname, all_targets) {
	var cur_trgs = all_targets[clipname];
	
	if (cur_trgs[0] === undefined) {
		alert("No targets with clipname: " + clipname);
	}
	
	
	console.log(clipname, cur_trgs, cur_trgs[0]);
	var stop_time = cur_trgs[0].t.slice(-1).pop();
	
	
	var query = {clip : clipname, stop_time : stop_time, items : []};
	
	for (var i=0; i<cur_trgs.length; i++) {
		var ct = cur_trgs[i];
		
		console.log(ct.t);
		if (stop_time.toFixed(1) !== ct.t.slice(-1).pop().toFixed(1)) {
			alert("annoTargets2TestQuery receives anno targets with varying last t. Sorry, but it cannot understand what to do now.");
		} else {
			
			query.items.push( {target_id: ct.id, target_type: ct.target_type, x : ct.x[0], y : ct.y[0]} ); 
		}
		
	}
	console.log('query', query);
	
	return query;
}


function clearQueries() {
	var parent = document.getElementById("screen");
	var query_boxes = parent.getElementsByClassName("query_box");
	
	for (var i=query_boxes.length; i--; i >= 0) {
		var node = query_boxes.item(i);
		node.parentNode.removeChild(node);
	}		
	

}


function confirmAnswers() {
	
	if (query_id >= 0) {
		var query = test_queries[query_id];


		for (var box_id=0; box_id<query.items.length; box_id++) {
			var qitem = query.items[box_id];
			var query_box_id = "query_box_" + query_id + '_' + box_id;
			
			var qbox = document.getElementById(query_box_id);
			var status = getQueryBoxStatus(qbox);
			if (status == 'notpresent') {
			
				registerPresence(query, query_id, box_id, "notpresent", query_started_realt);
			}
		}
	}
	
}


function loadTargetsFrom(json_file) { 
    
    $.getJSON(json_file, function(data) {
        cached_targets = data;
    });
	
}



function loadQueries() {
	var all_targets = cached_targets;
	
	var testset_num = sessionStorage.getItem("testset_num");
	if (testset_num == 'null') {
		testset_num = 0;
	}
	
	var cliplist = clipsets[testset_num];
	console.log('cliplist', cliplist);
	
	var test_queries = [];
	
	for (var i=0; i<cliplist.length; i++) {
		var clipname = cliplist[i];
		var query = annoTargets2TestQuery(clipname, all_targets);
		test_queries.push(query);
	}
	return test_queries;
}
	



function proceedIfAllAnswered() {
	/*
		USED with registerIdentity:
		If the query banner do not have any visible query boxes == all answered, then proceed to the next test clip.
	
	*/
	var parent = document.getElementById("screen");
	
	var query_boxes = parent.getElementsByClassName("query_box");
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
		
		clearQueries();
		startNextClip();
		console.log("rai");
	}
}
	
function registerIdentity(query_id, box_id, answer, query_started_realt) {
	/*
		Registers which object the query box represents.
	*/
	
	
	var player_id = sessionStorage.getItem("player_id");
	
	var answer_latency = (Date.now() - query_started_realt) / 1000;
	
	var answer = { player_id : player_id,
				   query_id : query_id,
				   query_started_realt : query_started_realt,
				   answer_latency : answer_latency,
				   answer : answer};
				   
	test_answers.push(answer);
	
	proceedIfAllAnswered();
}


function registerPresence(query, query_id, box_id, answer, query_started_realt) {
	/* 
		Registers if a query box is labeled as having something.
	*/
	var query_items = query.items;
	
	var query_box_id = "query_box_" + query_id + '_' + box_id;
		
	var player_id = sessionStorage.getItem("player_id");
	
	var answer_latency = (Date.now() - query_started_realt) / 1000;
	
	console.log("reg presence ", query);
	
	var answer = { player_id : player_id,
				   src : query.clip,
		           src_stop_time : query.stop_time,
				   query_id : query_id,
				   box_id : box_id,
				   query_started_realt : query_started_realt,
				   answer_latency : answer_latency,
				   answer : answer,
				   target_id :  query_items[box_id].target_id,
		           target_type : query_items[box_id].target_type,
				   target_x : query_items[box_id].x,
		           target_y : query_items[box_id].y};
				   
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


function showQuery(query) {
	var query_items = query.items;
	
	console.log("showQuery called");
	
	var vplayer = document.getElementById("videoplayer");
	var nbutton = document.getElementById("nextbutton");
	var screen = document.getElementById("screen");


	//var qbanner = document.getElementById("query_banner");
	
	
	var qbt = document.getElementById("query_box_template");

	//qbanner.style.display = "block";
	//qbanner.style.top = videoplayer.style.top;
	//qbanner.style.left = videoplayer.style.left;
	
	vplayer.pause();
	
	query_started_realt = Date.now();
	
		
	for (var box_id=0; box_id<query_items.length; box_id++) {
		var query_box_id = "query_box_" + query_id + '_' + box_id;

		var qbox = qbt.cloneNode(true);
		qbox.id = query_box_id;


		var qitem = query_items[box_id];
		
		var pedestrian = qbox.getElementsByClassName("pedestrian").item(0);
		var bicycle = qbox.getElementsByClassName("bicycle").item(0);
		var car = qbox.getElementsByClassName("car").item(0);
		var occlusion = qbox.getElementsByClassName("occlusion").item(0);
		var nothing = qbox.getElementsByClassName("nothing").item(0);

		
		function makeCallbackRA(q_id, b_id, ans) {
			return function() { 
				var query_box_id = "query_box_" + query_id + '_' + box_id;				
				var qbox = document.getElementById(query_box_id);
				qbox.style.display = "none";
				qbox.parentNode.removeChild(qbox);
				
				registerIdentity(q_id, b_id, ans, query_started_realt); } 
		}

		function makeCallbackTB(qi, q_id, b_id) {
			return function() { var status = toggleQueryBox(q_id, b_id); 
							    registerPresence(query, q_id, b_id, status, query_started_realt); } 
		}
		
		pedestrian.addEventListener("click", makeCallbackRA(query_id, box_id, "pedestrian"), false);
		bicycle.addEventListener("click", makeCallbackRA(query_id, box_id, "bicycle"), false);
		car.addEventListener("click", makeCallbackRA(query_id, box_id, "car"), false);
		nothing.addEventListener("click", makeCallbackRA(query_id, box_id, "nothing"), false);
		occlusion.addEventListener("click", makeCallbackRA(query_id, box_id, "occlusion"), false);
		
		
		
		qbox.addEventListener("click", makeCallbackTB(qitem, query_id, box_id), false);

		screen.appendChild(qbox);  
		qbox.style.display = "block";
		
		var clientxy = rel2Client(vplayer, qitem.x, qitem.y);
		var centering =	[qbox.offsetWidth * 0.5, qbox.offsetHeight * 0.5];
		
		
		qbox.style.top = (clientxy[1] - centering[1]) + "px"; 
		qbox.style.left = (clientxy[0] - centering[0]) + "px";
		
		
		

	}

	vplayer.style.display = "none";
	
	nbutton.style.display = "block";
	
}

function saveTestAnswers() {
	var answers_key = "trubike.test.answers";
	
	var player_id = sessionStorage.getItem("player_id");
	var local_answers_str = localStorage.getItem(answers_key);

	var local_answers = JSON.parse(local_answers_str);
	if (local_answers === null) {
		local_answers = {};
	}
	
	console.log("trubike.test.answers recovered from localStorage: ", local_answers);
	
	if (! local_answers.hasOwnProperty(player_id) )  {
		local_answers[player_id] = [];
	}
	
	
	local_answers[player_id].push(test_answers);
	
	console.log("local_answers with player_id ", local_answers[player_id]);
	
	localStorage.setItem(answers_key, JSON.stringify(local_answers));
	
	
}
	 


function startNextClip() {
	console.log("startNextClip called");
	
	query_id += 1;
	
	if (query_id == 0) {
		test_queries = loadQueries();
	}
	
	
	saveTestAnswers();
	clearQueries();
	
	var nbutton = document.getElementById("nextbutton");
	nbutton.style.display = "none";
	
	var vplayer = document.getElementById("videoplayer");
	vplayer.style.display = "block";
	
	console.log('test_queries', test_queries);
	
	if (query_id < test_queries.length) {
		var query = test_queries[query_id];

		
		vplayer.src = clippath + query.clip
		console.log("vplayer.src", vplayer.src);
		vplayer.play();
		
		console.log(query_id, query.items, 'stop_time*1000', query.stop_time * 1000);
		
		setTimeout(function() { showQuery(query); }, query.stop_time * 1000);
	} else {
		document.location.href = "../index.html";
	}
}


function toggleQueryBox(query_id, box_id) {
	var query_box_id = "query_box_" + query_id + '_' + box_id;
	
	var qbox = document.getElementById(query_box_id);

	var status = getQueryBoxStatus(qbox);
	var newstatus = null;
	if (status == 'present') {
		newstatus = 'notpresent';
	
	} else {
		newstatus = 'present';
	}
	setQueryBoxStatus(qbox, newstatus);
	return newstatus;
}



function getQueryBoxStatus(qbox) {
	var qbt = qbox.getElementsByClassName("query_box_target").item(0);
	var bgcolor = qbt.style.backgroundColor;
	
	var status = null;
	if (bgcolor != query_box_present_color) {
		status = 'notpresent';
	} else {
		status = 'present';
	}
	return status;
}

function setQueryBoxStatus(qbox, status) {
	var qbt = qbox.getElementsByClassName("query_box_target").item(0);
	var bgcolor = 'transparent';
	if (status == 'present') {
		bgcolor = query_box_present_color;
	}
	qbt.style.backgroundColor = bgcolor;
	return status;
}


function setupInteraction() {
	
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
			case 'c'.charCodeAt(0):
				var vplayer = document.getElementById("videoplayer");
				
				if (vplayer.style.display == "block") {	
					vplayer.style.display = 'none';
				} else {
					vplayer.style.display = 'block';
				}
				break;
		}
	});
	
}
	