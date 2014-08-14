$(function(){
	//ohjeiden näyttö ja piilotus
    // This does not work on peli.html for example. Remove? EL 14.8. 
	//if (sessionStorage.getItem("isFirst") != "false") {
	//		var b = document.getElementById("alkuohje");
	//		b.style.display = "block";
	//		sessionStorage.setItem("isFirst", false);	
    //} 
    
	$("#alkuohje").click(function(){
		$("#alkuohje").hide("slow");
    });
    
    $("ohje").click(function(){
        $(".ohjeruutu").show("fast");
    });
		
	$(".ohjeruutu").click(function(){
		$(".ohjeruutu").hide("slow");
	});
    
    //kirjautumisominaisuudet
	$("#kirjautuminen").text(function( index ) {
		var kayttaja = sessionStorage.getItem("kayttaja")
		if (kayttaja != null) {
			$("#kirjautuminen").html(kayttaja);  //korvaa Kirjaudu -linkin käyttäjän nimellä
			};
	showPointsBanner();
    });

    $("#kirjautumisruutu").on('submit', function(e) {
        if (($("#kayttaja").val() == "") || ($("#salasana").val() == "")) {
            return false;				/*tekee sen että ei voi kirjautua tyhjällä käyttäjänimikentällä */
        } else {
            tallennaNimi(($("#kayttaja").val()));
        };
    });
    
    $("#kirjautuminen").text(function( index ) {
        var kayttaja = sessionStorage.getItem("kayttaja")
        if (kayttaja != null) {
            $("#kirjautuminen").html(kayttaja);  //korvaa Kirjaudu -linkin käyttäjän nimellä ja puhelinlogolla
        };
    });
});