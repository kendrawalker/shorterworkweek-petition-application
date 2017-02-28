// hamburger menu


var hamburgerIcon = $('.hamburger').eq(0);
var hamburgerMenu = $('.hamburger-menu').eq(0);

hamburgerIcon.on('mousedown', function() {
    console.log('it was clicked');
    hamburgerMenu.css("display","block");
});

hamburgerMenu.on('mousedown', function(e) {
    console.log('it was clicked');
    if(e.target.classList.contains('menu-close')) {
        console.log('menu should close');
        hamburgerMenu.css("display","none");
    }
});
