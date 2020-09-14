$(document).ready(function () {
    $('.sidenav').sidenav();
    $('.datepicker').datepicker();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
});

$(document).on("click", "#open-nav", function(){
    $('.sidenav').sidenav('open');
});