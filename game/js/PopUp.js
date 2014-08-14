$(function(){
    $('#alkuohje').hide();
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
    $('#kirjautumiskentta').click(function(){
        $(this).fadeOut(600, function(){
            $(this).hide();
        });
    });

});