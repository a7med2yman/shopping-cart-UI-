Stripe.setPublishableKey("pk_test_51Max2mBNhT2wrrbFnCAxzCTzWnQsEGfzrwJsAayqZXUHHOo7KXubsy3tS7ydICaeA6JFbGHTxZTJ6w6qDunpLC8C00rypKWahB");

var $form = $('#checkout-form')

$form.submit(function(event){
    $form.find('button').prop('disabled',true);
    $('#payment-error').addClass('d-none');

    Stripe.card.createToken({
        number : $('#card-number').val(),
        cvc : $('#card-cvc').val(),
        exp_month : $('#card-expiry-month').val(),
        exp_year : $('#card-expiry-year').val(),
    },stripeResponseHandler);
    
    return false 
});

function stripeResponseHandler (status , response){

    if ( response.error) { //problem

        // show the error on the form 
        $('#payment-error').text(response.error.message);
        $('#payment-error').removeClass('d-none');
        $form.find('button').prop('disabled', false ) //re-enable submission
    }else{

        //get the token id
        var token = response.id;

        // insert the token into the form so it get submitted to the server
        $form.append($('<input type="hidden" name="stripeToken" />').val(token));

        //submit the form 
        $form.get(0).submit();
    }
}