$(document).ready(function () {
    $('.sidenav').sidenav();
    $('.datepicker').datepicker();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();

    $('#list-node-1').click(function() {
        $('#modal').modal();
        $('#modal').modal('open');
    });

    $('.sensorToggle').click(function() {
        $(".sensor-view").toggle();
    });

    $('.node-details-more').hide();
    $('.show-more').on('click', function() {
        //toggle elements with class .ty-compact-list that their index is bigger than 2
        $('.node-details-more').toggle();
        //change text of show more element just for demonstration purposes to this demo
        $('.show-more').text() === 'Show more' ? $('.show-more').text('Show less') : $('.show-more').text('Show more');
    });

    // if ($('#gprs').is(':empty')){
    //     $('.gps-status').show();
    //     $('.sensor-status-gps').removeClass("active");
    //     $('.gps-status').text("Connected...waiting for GPRS Sensor event...")
    // } else {
    //     $('.sensor-status-gps').addClass("active");
    //     $('.gps-status').hide();
    // }
});

$(document).on("click", "#open-nav", function(){
    $('.sidenav').sidenav('open');
});