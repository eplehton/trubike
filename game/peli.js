
function Shot(x, y, t, src) {
    this.x = x
    this.y = y
    this.t = t
    this.src = src
}

function Target(src) {
    this.x = []
    this.y = []
    this.t = []
    this.src = src
}

Target.prototype.addPoint = function(x, y, t) {
    this.x.push(x)
    this.y.push(y)
    this.t.push(t)
}


var shoots = []
var targets = []

var clipset_pos = 0

var clipset =  [ ["1", "clips/WP_20131214_144652Z.mp4"], ["2", "clips/WP_20131214_144938Z.mp4"] , ["3", "clips/WP_20131214_145212Z.mp4"]]
				/*["4", "clips/WP_20131124_122348Z.mp4"], ["5", "clips/hertton_pkoti.mp4"],
               ["6", "clips/hertton_pkoti2.mp4"]] */

               
function checkTargetHit(shot) {
    var vplayer = document.getElementById("videoplayer")
    var ctime = vplayer.currentTime
    var targett = 5.0
    var targetx = 200
    var targety = 200
    var hit_radius = 200
    var hit_interval = 1.0
    
    console.log(shot.t, ctime)
    
    if (Math.abs(shot.t - targett) < hit_interval) {
       var d2 = Math.sqrt(Math.pow(shot.x - targetx, 2) + Math.pow(shot.y - targety, 2))
       if (d2 < hit_radius) {
            return true
       }
    }
    return false
}

function registerShot(x, y, t) {
    console.log("x=" + x + " y=" + y + " time=" + t)
    src = clipset[clipset_pos][1]
    var shot = new Shot(x, y, t, src)
    shoots.push(shot)
    return shot
    //console.log(hit_data[hit_data.length-1][0])
}

function startVideo() {
   var vplayer = document.getElementById("videoplayer")
   vplayer.src = clipset[clipset_pos][1]
   vplayer.play()
}

function stopVideo() {
   var vplayer = document.getElementById("videoplayer")
   vplayer.stop()
}

function hideInstruction() {
    var instr = document.getElementById("instruction")
    instr.style.display = "none";    
}

function videoClicked(ev) {
    
    var vplayer = document.getElementById("videoplayer")
    var thplayer = document.getElementById("targethitplayer")
    var ctime = vplayer.currentTime
    
    if (ctime == 0.0) {
       hideInstruction()
       startVideo()
    } else {
        var x = ev.clientX
        var y = ev.clientY
        
        // gui update
        var hp_tmpl = document.getElementById("hitpoint_tmpl")
        var hp = hp_tmpl.cloneNode() 
        hp.id = hp.id + "_" + Math.round(ctime*1000)
        setTimeout( function(){ hp.style.display = "none"}, 250)
        document.body.appendChild(hp)
        
        hp.style.display = "block"
        hp.style.position = "absolute"
        hp.style.left = x
        hp.style.top = y 
        
        var shot = registerShot(x, y, ctime)
        var was_hit = checkTargetHit(shot)
        console.log("was_hit: " + was_hit)
        if (was_hit) {
            hp.style.background = "green"
            thplayer.currentTime = 0.0
            thplayer.play()
        }
        
    }
}

function videoEnded(ev) {
    
	
	var video = document.getElementById("videoplayer")
    video.src = "" 
    clipset_pos += 1
    
    if (clipset_pos < clipset.length) {
		$("#klipinloppu").show();
    } else {
		$("#tasonloppu").show();
	}
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


function tallennaNimi(nimi) {
	sessionStorage.setItem(nimi, "0"); 
}

var kayttaja = ""

/*function getNimi(nimi) {
	kayttaja = sessionStorage.getItem(nimi));
	
	document.write(sessionStorage.getItem(nimi));
	sessionStorage.getItem(nimi));
	}
*/
