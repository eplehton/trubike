
var test_pos = -1;
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
						 queries : [["nothing", 500, 300],
								    ["car", 300, 700]]} ];


var test_answers = [];


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


function startNextClip() {
	
	test_pos += 1;
	
	if (test_pos < test_queries.length) {
	
		var vplayer = document.getElementById("videoplayer");
		vplayer.src = test_queries[test_pos].clip;
		vplayer.play();
		
		setTimeout(function() { showQuery(test_pos); }, test_stop_times[test_pos]);
	} else {
		alert("Ready!");
	}
}


function showQuery(query_id) {
	
	
	var vplayer = document.getElementById("videoplayer");

	var qbanner = document.getElementById("query_banner");
	var qbt = document.getElementById("query_box_template");

	qbanner.style.display = "block";
	vplayer.pause();
	

	var queries = test_queries[query_id].queries;
	console.log("queries", queries);
	
	for (var box_id=0; box_id<queries.length; box_id++) {
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
		
		qbox.style.top = queries[box_id][1] + "px"; 
		qbox.style.left = queries[box_id][2] + "px";
		
		qbanner.appendChild(qbox);  
		qbox.style.display = "block";
	}
}