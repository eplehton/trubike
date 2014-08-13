$(function(){
    $('#alkuohje').hide();
    $('.ohjeruutu').hide();
    
    $('#ohje').click(function(){
        $('.ohjeruutu').fadeIn(600).show();
    });
    $('.ohjeruutu').click(function(){
        $(this).fadeOut(600, function(){
            $(this).hide();
        });
    });
});