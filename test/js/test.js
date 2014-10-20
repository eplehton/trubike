
var test_pos = -1;
var test_videos = ['../clips/isoroba.mp4', 
                    '../clips/isoroba.mp4'];
var test_stop_times = [5500, 3200];

var targets = [ [["pedestrian", 100, 300],
                 ["car", 370, 400]],
                [["pedestrian", 100, 300],  
                 ["car", 370, 400]]]

function startVideo() {
    test_pos += 1;
    
    var vplayer = document.getElementById("videoplayer");
    
    vplayer.src = test_videos[test_pos];

    vplayer.play();
    
    setTimeout(stopVideo, test_stop_times[test_pos]);
   
}


function stopVideo() {
    var vplayer = document.getElementById("videoplayer");
    var qb = document.getElementById("query_banner");
    
    vplayer.pause();
    qb.style.display = "block";
    
    displayTargets();
}


function displayTargets() {
}

