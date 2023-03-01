var express = require("express");
var router = express.Router();

const product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require('../models/Order');

const stripe = require('stripe')('sk_test_51Max2mBNhT2wrrbF0o2AfDQfjsZQwa273gywdouEpUjoC3czlR2A3cQgX8n8KYlo9T9zdaOM1eyF20Yz6ga4M6UZ00cRq4C27r');

/* GET home page. */
router.get("/", function (req, res, next) {

  const successMsg = req.flash('success')[0];

  var totalproducts = null;

  if (req.isAuthenticated()) {
    if (req.user.cart) {
      totalproducts = req.user.cart.totalquantity;
    } else {
      totalproducts = 0;
    }
  }
  product
    .find({}, (error, doc) => {
      if (error) {
        console.log(error);
      }
      var productGrid = [];
      var colGrid = 3;
      for (var i = 0; i < doc.length; i += colGrid) {
        productGrid.push(doc.slice(i, i + colGrid));
      }
      res.render("index", {
        tittle: "shopping cart",
        products: productGrid,
        checkUser: req.isAuthenticated(),
        totalproducts: totalproducts,
        successMsg : successMsg ,
      });
    })
    .lean();
});

router.get("/addTocart/:id/:price/:name", (req, res, next) => {

  req.session.hasCart = true ;
  const cartID = req.user._id;
  const newProductPrice = parseInt(req.params.price, 10);

  const newProduct = {
    _id: req.params.id,
    price: newProductPrice,
    Name: req.params.name,
    Quantity: 1,
  };
  Cart.findById(cartID, (error, cart) => {
    if (error) {
      console.log(error);
    }
    if (!cart) {
      const newCart = new Cart({
        _id: cartID,
        totalquantity: 1,
        totalprice: newProductPrice,
        selectedproducts: [newProduct],
        createAt :  Date.now() ,
      });

      newCart.save((error, doc) => {
        if (error) {
          console.log(error);
        }
        console.log(doc);
      });
    }

    if (cart) {
      indexOfProduct = -1;
      for (var i = 0; i < cart.selectedproducts.length; i++) {
        if (req.params.id === cart.selectedproducts[i]._id) {
          indexOfProduct = i;
          break;
        }
      }
      if (indexOfProduct >= 0) {
        cart.selectedproducts[indexOfProduct].Quantity =
        cart.selectedproducts[indexOfProduct].Quantity + 1;
        cart.selectedproducts[indexOfProduct].price =
        cart.selectedproducts[indexOfProduct].price + newProductPrice;
        cart.totalquantity = cart.totalquantity + 1;
        cart.totalprice = cart.totalprice + newProductPrice;
        cart.createAt = Date.now();

        Cart.updateOne({ _id: cartID }, { $set: cart }, (err, doc) => {
          if (err) {
            console.log(err);
          }
          console.log(doc);
          console.log(cart);
        });
      } else {
        cart.totalquantity = cart.totalquantity + 1;
        cart.totalprice = cart.totalprice + newProductPrice;
        cart.selectedproducts.push(newProduct);
        cart.createAt = Date.now();

        Cart.updateOne({ _id: cartID }, { $set: cart }, (err, doc) => {
          if (err) {
            console.log(err);
          }
          console.log(doc);
          console.log(cart);
        });
      }
    }
  });

  res.redirect("/");
});

router.get("/shopping-cart", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect("/users/signin");
    return;
  }
  if (!req.user.cart) {
    res.render("shopping-cart" , {checkUser:true , totalproducts : 0 , hasCart : req.session.hasCart });
    req.session.hasCart = false ;
    return;
  }

  const userCart = req.user.cart;

  res.render("shopping-cart", {
    userCart: userCart,
    totalprice: req.user.cart.totalprice,
    selectedproducts: req.user.cart.selectedproducts,
    checkUser:true,
    totalproducts:req.user.cart.totalquantity,
  });
});

router.get("/increaseProduct/:index",( req , res , next )=>{

  if(req.user.cart){

  const index = req.params.index;
  const userCart = req.user.cart;
  const productPrice = userCart.selectedproducts[index].price / userCart.selectedproducts[index].Quantity

  userCart.selectedproducts[index].Quantity = userCart.selectedproducts[index].Quantity + 1 ;
  userCart.selectedproducts[index].price = userCart.selectedproducts[index].price + productPrice

  userCart.totalquantity = userCart.totalquantity + 1
  userCart.totalprice = userCart.totalprice + productPrice
  userCart.createAt = Date.now();

  Cart.updateOne({_id : userCart._id }, { $set : userCart }, (err , doc)=>{
    if(err){
      console.log(err);
    }
    console.log(doc);
    res.redirect('/shopping-cart');
  })
  
  } else{
    res.redirect('/shoppin-cart') ;
  }
  
})

router.get("/decreaseProduct/:index", ( req , res , next )=>{

  if(req.user.cart){

    const index = req.params.index;
    const userCart = req.user.cart;
    const productPrice = userCart.selectedproducts[index].price / userCart.selectedproducts[index].Quantity
  
    userCart.selectedproducts[index].Quantity = userCart.selectedproducts[index].Quantity - 1 ;
    userCart.selectedproducts[index].price = userCart.selectedproducts[index].price - productPrice
  
    userCart.totalquantity = userCart.totalquantity - 1
    userCart.totalprice = userCart.totalprice - productPrice
    userCart.createAt = Date.now();
  
    Cart.updateOne({_id : userCart._id }, { $set : userCart }, (err , doc)=>{
      if(err){
        console.log(err);
      }
      console.log(doc);
      res.redirect('/shopping-cart');
    })

  }else{
    res.redirect('/shopping-cart');
  }
  
})

router.get("/deleteProduct/:index" , ( req ,res ,next )=>{
  
  if (req.user.cart) {
    
    const index = req.params.index;
 const userCart = req.user.cart;
 const length = userCart.selectedproducts.length

 if( length <= 1 ){
  Cart.deleteOne({_id : userCart._id} , (err , doc)=>{
    if(err){
      console.log(err);
    }
    console.log(doc);
    res.redirect('/shopping-cart');
  })
 }else{

 userCart.totalprice = userCart.totalprice - userCart.selectedproducts[index].price ; 
 userCart.totalquantity = userCart.totalquantity - userCart.selectedproducts[index].Quantity ;

 userCart.selectedproducts.splice( index , 1);
 userCart.createAt = Date.now();


 Cart.updateOne({_id : userCart._id }, { $set : userCart }, (err , doc)=>{
  if(err){
    console.log(err);
  }
  console.log(doc);
  res.redirect('/shopping-cart');
})
}

  } else {
    res.redirect('/shopping-cart');
  }
  
})

router.get("/checkout", (req ,res ,next)=>{
  
  if( req.user.cart ){
    const errMsg = req.flash('error')[0];

    if(req.user.userName === undefined || req.user.address === undefined || req.user.contact === undefined){
      req.flash("profileError", ['please update your information befor do order']);
      res.redirect('users/profile');
      return ;
    }

  res.render("checkout",{ checkUser : true ,
    totalproducts : req.user.cart.totalquantity ,
    totalprice : req.user.cart.totalprice,
    errMsg : errMsg ,
    user : req.user ,
    })
  } else{

    res.redirect('/shopping-cart')
  }
  
})

router.post("/checkout", (req ,res ,next)=>{

  stripe.charges.create({
    
    amount : req.user.cart.totalprice * 100,
    currency : "usd",
    source : req.body.stripeToken,
    description : "test charge "
  },
    function ( err , charge){
    if(err){
      console.log(err.raw.message);
      
      req.flash("error", err.raw.message );
      
      return res.redirect('/checkout');
    }

    req.flash('success','successfuly bought products !!');

    const order = new Order({
      user : req.user.id ,
      cart : req.user.cart ,
      address : req.body.address,
      name : req.body.name ,
      contact : req.body.contact ,
      paymentId : charge.id ,
      orderPrice : req.user.cart.totalprice , 
    })

    order.save(( err, result)=>{
      if(err){
        console.log(err);
      }
      console.log(result);

      Cart.deleteOne({_id : req.user.cart._id} , (err , doc)=>{
        if(err){
          console.log(err);
        }
        console.log(doc);
        res.redirect('/');
      })
    })


  })
})

module.exports = router;
