$(document).ready(function(){	
	$("#alkuohje").click(function(){
		$("#alkuohje").hide("slow");
		});
    $("#ohje").click(function(){
		$("#alkuohje").show("slow");
		});
	
	$("#kirjautuminen" ).text(function( index ) {
		var kayttaja = sessionStorage.getItem("kayttaja")
		if (kayttaja != null) {
			$("#kirjautuminen").html("\u260E  " + kayttaja);  //korvaa Kirjaudu -linkin käyttäjän nimellä ja puhelinlogolla
			}
		});
	
	showPoints();
	
	$("#ohje").click(function(){
			$(".ohjeruutu").show("fast");
		});
	
	
	$(document).ready(function(){
		$(".ohjeruutu").click(function(){
			$(".ohjeruutu").hide("slow");
		});
	});
	
	
	$("#kirjautumisruutu").on('submit', function(e) {
		if (($("#kayttaja").val() == "") || ($("#salasana").val() == "")) {
			return false;				/*tekee sen että ei voi kirjautua tyhjällä käyttäjänimikentällä */
			}
		else {
			tallennaNimi(($("#kayttaja").val()));
			}
	});
				
				
	$("#kirjautuminen" ).text(function( index ) {
		var kayttaja = sessionStorage.getItem("kayttaja")
		if (kayttaja != null) {
			$("#kirjautuminen").html("\u260E  " + kayttaja);  //korvaa Kirjaudu -linkin käyttäjän nimellä ja puhelinlogolla
			}
		});
				
	})
	
	
});