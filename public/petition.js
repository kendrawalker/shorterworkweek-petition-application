//petition js

var inpFirst = $('#text-input-first').eq(0);
var inpLast = $('#text-input-last').eq(0);
var canvas = document.getElementById('signature');
var ctx = canvas.getContext('2d');
var signatureBox = $('#signature').eq(0);
var signedName = $('#signed-name').eq(0);
var submitButton = $('#submit-button').eq(0);
var firstName;
var lastName;
var dataURL;


//setting input field to blank when user clicks to type
inpFirst.on('click', function(){
    inpFirst.html('');
});
inpLast.on('click', function(){
    inpLast.html('');
});

//signing in the signature box
signatureBox.on('mousedown', function(e) {
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    signatureBox.on('mousemove', function(e) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }).on('mouseup', function(){
        signatureBox.off('mousemove');
    });
});

//calling results when user clicks the button
submitButton.on('click', function() {
    firstName = inpFirst.val();
    console.log(firstName);
    lastName = inpLast.val();
    console.log(lastName);
    dataURL = canvas.toDataURL();
    console.log(dataURL);
    signedName.val(dataURL);
    console.log(signedName.val());
});
