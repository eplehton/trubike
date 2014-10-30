
var test_pos = -1;
var test_videos = ['../clips/157_isoroba.mp4', 
                    '../clips/157_isoroba.mp4'];
var test_stop_times = [2000, 3200];

var targets = [ [["pedestrian", 100, 300],
                 ["car", 370, 400]],
                [["pedestrian", 100, 300],  
                 ["car", 370, 400]]]




var test_answers = []


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
	
	console.log(all_answered);
		
	if (all_answered) {
		query_banner.style.display = "none";
		startNextClip();
		console.log("rai");
	}
}
	
function registerAnswer(query_id, answer, query_started_realt) {
	var query_box_id = "query_box_" + query_id;
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
	
	var vplayer = document.getElementById("videoplayer");
	vplayer.src = test_videos[test_pos];
	vplayer.play();
	
	setTimeout(function() { showQuery(1); }, test_stop_times[test_pos]);
}


function showQuery(query_id) {
	var query_box_id = "query_box_" + query_id;
	
	var vplayer = document.getElementById("videoplayer");

	var qbanner = document.getElementById("query_banner");
	var qbt = document.getElementById("query_box_template");

	qbanner.style.display = "block";
	vplayer.pause();
	


	var qbox = qbt.cloneNode(true);
	qbox.id = query_box_id;


	var pedestrian = qbox.getElementsByClassName("pedestrian").item(0);
	var bicycle = qbox.getElementsByClassName("bicycle").item(0);
	var car = qbox.getElementsByClassName("car").item(0);
	var nothing = qbox.getElementsByClassName("nothing").item(0);
	
	var query_started_rt = Date.now();
	
	pedestrian.addEventListener("click", function() { registerAnswer(query_id, "pedestrian", query_started_rt); }, false);
	bicycle.addEventListener("click", function() { registerAnswer(query_id, "bicycle", query_started_rt); }, false);
	car.addEventListener("click", function() { registerAnswer(query_id, "car", query_started_rt); }, false);
	nothing.addEventListener("click", function() { registerAnswer(query_id, "nothing", query_started_rt); }, false);
	
	
	qbox.addEventListener("click", function() { proceedIfAllAnswered(qbanner); }, false);
	
	
	qbox.style.top = "200px";
	qbox.style.left = "300px";
	
	qbanner.appendChild(qbox);  
	qbox.style.display = "block";
}