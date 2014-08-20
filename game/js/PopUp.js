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
    
    $('#kirjaudu').click(function(){
        $('#kirjautumiskentta').fadeIn(600).show();
    });
    $('#kirjaudu').click(function(){
        $('#kirjautumiskenttä').fadeOut(600, function(){
            $(this).hide();
        });
    });
    
    

    $("#kirjautumisruutu").on('submit', function(e) {
        if (($("#kayttaja").val() == "") || ($("#salasana").val() == "")) {
            return false;				/*tekee sen että ei voi kirjautua tyhjällä käyttäjänimikentällä */
        } else {
            tallennaNimi(($("#kayttaja").val()));
        };
    });
    


});