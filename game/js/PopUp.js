	$(function(){
    $('.ohjeruutu').hide();
    $('#kirjautumiskentta').hide();
    
	
    $('#ohje').click(function(){
        $('.ohjeruutu').fadeIn(600).show();
    });
    
	
    $('.ohjeruutu').click(function(){
        $(this).fadeOut(600, function(){
            $(this).hide();
        });
    });
	
	
    
/* 	$(document).ready(function(){	
				
    var player_id = sessionStorage.getItem("player_id");        //Tämä on document.ready -funktio joten sen tulee olla index-sivulla. 
	if (player_id == null) {
		$("kirjautumiskentta").show();
	}
	});			
				 */
				 
				 
				 
			
	$("#submit_login").click(function(e) {  /*tekee sen että ei voi kirjautua tyhjällä käyttäjänimikentällä */
		if ($("#kayttaja").val() == "") {
			return false;				
		} else {
			setPlayer(($("#kayttaja").val()));
			var b = document.getElementById("kirjautumiskentta");
			b.style.display = "none";
			
		};
	});
	
	
	
	$("#kirjauduulos").click(function(e) {
		sessionStorage.removeItem("player_id");
		document.location.reload(); 
	});
	


	
});
	
