
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



var points = 0
	
var shots = [] 
var targets = []

var clipset_pos = 0

var clipset =  [ ["1", "clips/potkulautailija.mp4"], 
                 ["2", "clips/isoroba.mp4"],
                 ["3", "clips/jalankulkija_ja_suojatie.mp4" ], 
                 ["4", "clips/jalankulkijat2.mp4"], 
                 ["5", "clips/vastaantulijat.mp4"], 
                 ["6", "clips/ratikka.mp4"] ]


               
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
    shots.push(shot)
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

var i = 0

function videoClicked(ev) {
    
    var vplayer = document.getElementById("videoplayer")
    var thplayer = document.getElementById("targethitplayer")
    var ctime = vplayer.currentTime
	
    //if (ctime == 0.0) {
       //hideInstruction()
       //startVideo()
    //} else {  
	if (ctime > 0.0) {
        var x = ev.clientX
        var y = ev.clientY
        
        // gui update
        var hp_tmpl = document.getElementById("hitpoint_tmpl") 				//etsii hitpoint_tmpl nimisen divin html-tiedostosta
        var hp = hp_tmpl.cloneNode() 										//kloonaa sen
        hp.id = "hitpoint_" + Math.round(ctime*1000) 						 // antaa kloonille (hp) id:n "hitpoint_" ja ajan millisekunteina
        setTimeout( function(){ hp.style.display = "none"}, 250) 			 // setTimeout kutsuu anonyymin funktion: eli (piilottaa hp:n, 250 ms kuluttua)
        document.body.appendChild(hp)  										//dokumenttiin lisätään uusi klooni hp
      
        hp.style.display = "block"  										// displayaa hp:n, style eli ulkonäkö määritetty css:ssä
        hp.style.position = "absolute" 										// displayataan absoluuttisesti x:n ja y:n mukaan 
        hp.style.left = x + "px"
        hp.style.top = y  + "px"
        
        var shot = registerShot(x, y, ctime) 								//rekisteröi klikkauksen kordinaatit ja ajan
        var was_hit = checkTargetHit(shot) 									// tsekkaa osuiko targettiin
        console.log("was_hit: " + was_hit)  								//printtaa konsoliin "was_hit: " ja true tai false
        if (was_hit) {
			points += 1
			showPoints()
            hp.style.background = "green"
            thplayer.currentTime = 0.0 										//asettaa audioplayerin nollaan.
            thplayer.play()  												//soittaa audioplayerista äänen että osuttiin oikeaan
        }
		
    }
}

function videoEnded(ev) {
    sessionStorage.setItem(clipset_pos + "_videoshots", shots)    //tekee sessionstorageen shotslistan nimeltä "0_videoshots"  jonka value on ekan videon shotit, sitten 1_videoshots.....
												
	var video = document.getElementById("videoplayer")
    video.src = "" 
    clipset_pos += 1
    
    if (clipset_pos < clipset.length) {
		$("#klipinloppu").show();
    } else {
		$("#tasonloppu").show();
	}
	
	printToLog()
	shots = []					// tyhjentää shotslistan seuraavaa videota varten
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
	sessionStorage.setItem("kayttaja", nimi); 
	
}

function showPoints() {
	/*var current_points = document.getElementById("pisteet")
	current_points.innerHTML="Pisteet: " + points;  */             //Tämän aktivoiminen tekee mm. sen, että klipinlopun hideaminen ja videon starttaaminen (jQueryssä) ei toimi...?
	
	var current_points2 = document.getElementById("pisteruutu")
	current_points2.innerHTML="Pisteet: " + points;
	}
	

	
	
function printToLog() {            //printtaa konsoliin kaikki shotit jotka on shots-listalla
	console.log("tässä printToLogin outputti:")
	var j = 0
	while (j < shots.length) {
		console.log(shots[j].x)
		console.log(shots[j].y)
		console.log(shots[j].t)
		j += 1
		}
	}


	
	