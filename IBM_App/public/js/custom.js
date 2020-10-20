$(document).ready(function () {
    $('.sidenav').sidenav();
    $('.datepicker').datepicker();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    $('#list-node-1').click(function() {
        $('#modal').modal();
        $('#modal').modal('open');
    });

});

$(document).on("click", "#open-nav", function(){
    $('.sidenav').sidenav('open');
});