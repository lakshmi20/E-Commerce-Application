var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var sess_store = require('express-mysql-session');

var routes = require('./routes');
var users = require('./routes/user');
//var viewUser = require('./routes/viewUser');
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var storeOptions = {

 host     : 'localhost',
 user     : 'root',
 password : 'root',
 database : 'ediss'
 
 /*host     : 'ediss.chxt7fnltnys.us-east-1.rds.amazonaws.com',
 user     : 'lakshmis',
 password : 'Anansat123.',
 database : 'ediss'*/

};

app.use(favicon());
app.use(logger('dev'));
app.use(session({
      store: new sess_store(storeOptions),
      secret: 'meera', 
      saveUninitialized: true, 
      resave: true, 
      cookie: {
      path: '/', 
      httpOnly: true, 
      maxAge: 90000
      }, 
      rolling: true}
      )
      );
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

app.get('/', routes.index);
app.get('/users', users.list);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});
/* setting up mysql connection */
var mysql      = require('mysql');
/*var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'ediss'
});*/

var pool = mysql.createPool(storeOptions);
//connection.connect();
/*session variable */
var user_ses;
/*register function*/

app.post('/registerUser',function(req,res){

  var firstname = req.body.fname;
  var lastname = req.body.lname;
  var address = req.body.address;
  var city = req.body.city;
  var state = req.body.state;
  var zip = req.body.zip;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var flag = 0;
  var atpos ;
  var dotpos ;
  
  if(email != null || email != ""){
  var atpos = email.indexOf("@");
  var dotpos = email.lastIndexOf(".");
  if (atpos<1 || dotpos<atpos+2 || dotpos+2>=email.length){
  flag =1 ;
  }
  else{
  flag = 0;
  }
}
  
  if (firstname == "" || lastname == "" || address == "" || city == "" ||state == "" || zip == "" || email == "" || username == "" || password == "" ) {
   res.json({"message" :"There was a problem with this action"});
  }
  else if ((zip.length != 5 ) || (flag = 0)) {
  
  res.json({"message" :"There was a problem with this action"});
  }
  else {
  
  var type = "customer";
  
  var data = {
	    firstname: firstname,
		lastname: lastname,
		address: address,
		city: city,
		state: state,
		zip: zip,
		email: email,
		username: username,
		password: password,
		type: type,    
    };
    pool.getConnection(function(err,connection) {
    connection.query('INSERT INTO users set ? ',data,function(err,rows) {            
		    if(err) {
		      res.json({"message":"There was a problem with this action"});
		    }
		    else {
		      res.json({"message":"Your account has been registered"});	
		    }
  		});
  		connection.release();
  		});
  } 
});

/*login function*/
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    
    if(username == "" || password == "" || typeof username == 'undefined' || typeof password == 'undefined'){
      res.json({"message":"Please enter username and password"});
    }
    else{
    pool.getConnection(function(err,connection) {
    connection.query('SELECT * FROM users WHERE username = ?  AND password = ?',[username,password],function(err,rows){
    	  if(err){
    		  res.json({"message":"That username and password combination was not correct"});
    	  }
    	  if(rows.length > 0){
    	  user_ses = req.session;
    	        user_ses.user = username;
    	        user_ses.type = rows[0].type;
                user_ses.status = "logged in";
                var id = req.sessionID;
                var name = rows[0].firstname;
    	res.json({"message":"Welcome " +name,});
    	
    	connection.query('UPDATE users SET sessionid = ? WHERE username = ?',[id,username], function(err,rows) {

            if(err) {
              //res.json({"error":"session upadate failed"});
            }

          });
    	  }
    	  else{
    		  
    	        res.json({"message":"That username and password combination was not correct"});
    	  }
      });
      connection.release();
      });
    }

});
/* logout function */
  app.post('/logout', function(req, res) {
  user_ses = req.session;
  var id = req.sessionID;
  var username = user_ses.user;
  
  if(username) {
  
        user_ses.destroy();
        
        res.json({"message":"You have been logged out"});
  }
  
  else{
  res.json({"message":"You are not currently logged in"});
  }

  
  /*connection.query('SELECT * FROM users WHERE sessionid = ?',[id],function(err,rows) {            
      if(err) {
        
        res.json({"message":"You are not currently logged in"});
      }
      if(rows.length > 0) {
        user_ses.destroy();
        res.json({"message":"You have been logged out"});
      }
      else {
        res.json({"message":"You are not currently logged in"});
      } 
    });*/
  });
/*update contact information*/
app.post('/updateInfo', function(req, res) {
	

	var firstname = req.body.fname;
	var lastname = req.body.lname;
	var address = req.body.address;
	var city = req.body.city;
	var state = req.body.state;
	var zip = req.body.zip;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var flag = 0;
	var sessid;
	var query = "UPDATE users SET";

    if(typeof firstname != 'undefined' && firstname != "") {
		query += " firstname= '"+firstname+"',";
	}

	if(typeof lastname != 'undefined' && lastname != "") {
		query += " lastname= '"+lastname+"',";
	}

	if(typeof address != 'undefined' && address != "") {
		query += " address= '"+address+"',";
	}

	if(typeof city != 'undefined' && city != "") {
		query += " city= '"+city+"',";
	}

	if(typeof state != 'undefined' && state != "") {
		
		query += " state= '"+state+"',";
	}

	if(typeof zip != 'undefined' && zip != "") {
		if(zip.length != 5) {
			flag = 1;
		}
		query += " zip= '"+zip+"',";
	}

	if(typeof email != 'undefined' && email != "") {
	    var atpos = email.indexOf("@");
        var dotpos = email.lastIndexOf(".");
        if (atpos<1 || dotpos<atpos+2 || dotpos+2>=email.length){
         flag =1 ;
        }
		query += " email= '"+email+"',";
	}

	if(typeof username != 'undefined' && username != "") {
		query += " username= '"+username+"',";
	}

	if(typeof password != 'undefined' && password != "") {
		query += " password= '"+password+"',";
	}
	
	user_ses = req.session;
    var id = req.sessionID;
    var username = user_ses.user;
    
    if(username) {
    
  	/*connection.query('SELECT * FROM users where sessionid = ?',[id],function(err,rows) {            
      if(err) {
        res.json({"message":"There was a problem with this action"});
      }
      else{*/
      //if(rows.length > 0) {
      	//sessid = rows[0].sessionid;
      	var updateQuery = query.substring(0,query.length-1);
      	//updateQuery = updateQuery+ " WHERE sessionid='"+sessid+"'";
      	updateQuery = updateQuery+ " WHERE username='"+username+"'";
	    if (flag == 0) {
	        pool.getConnection(function(err,connection) {
			connection.query(updateQuery,function(err,rows) {            
	    if(err) {
	      res.json({"message":"There was a problem with this action"});
	    }
	    else {
	      res.json({"message":"Your information has been updated"});
	    }     
  	});
  	connection.release();
  	});
		}
		else {
		    res.json({"message":"There was a problem with this action"});
		}
      }
      else {
      	res.json({"message":"You must be logged in to perform this action"});
      }
    //}
  	//});
});
/*add product*/

app.post('/addProducts',function(req,res){

var productid = req.body.productId;
var name = req.body.name;
var description = req.body.productDescription;
var group = req.body.group;

  user_ses = req.session;
  var id = req.sessionID;
  var username = user_ses.user;
  var type = user_ses.type;
  
  if(user_ses.user) {
  
  if(type == 'admin'){
  
  if(productid == "" || name == "" || description == "" || group == "" || typeof productid == 'undefined' || typeof name == 'undefined' || typeof description == 'undefined' || typeof group == 'undefined'){
  
  res.json({"message":"There was a problem with this action"});
  
  }
  else{
  var data = {
	    productid: productid,
		name: name,
		description: description,
		product_group: group,
		
    };
    pool.getConnection(function(err,connection) {
    connection.query('INSERT INTO products set ? ',data,function(err,rows) {            
		    if(err) {
		      res.json({"message":"There was a problem with this action"});
		    }
		    else {
		      res.json({"message":"The product has been added to the system"});	
		    }
  		});
    connection.release();
    });
  }
  }
  else{
   res.json({"message":"Only admin can perform this action"});
  }
}
else{
res.json({"message":"You must be logged in to perform this action"});
}

});
/* modify product */
 
 app.post('/modifyProduct',function(req,res){
  var productid = req.body.productId;
  var description = req.body.productDescription;
  var name = req.body.name;
  
  
  user_ses = req.session;
  var id = req.sessionID;
  var username = user_ses.user;
  var type = user_ses.type;
  
  if(user_ses.user) {
  
  if(type == 'admin'){
  
  if(productid == "" || name == "" || description == ""  || typeof productid == 'undefined' || typeof name == 'undefined' || typeof description == 'undefined'){
  
  res.json({"message":"There was a problem with this action"});
  
  }
  else{
  pool.getConnection(function(err,connection) {
  connection.query ('SELECT * FROM products WHERE productid = ?',[productid],function(err,rows){
  
  if (err){
  
  res.json({"message":"There was a problem with this action"});
  }
  else{
      if(rows.length > 0){
      connection.query('UPDATE products SET name = ? , description = ? WHERE productid = ?',[name,description,productid],function(err,rows) {            
		    if(err) {
		      res.json({"message":"There was a problem with this action"});
		    }
		    else {
		      res.json({"message":"The product information has been updated"});	
		    }
  		});
      }
      
    else{
    res.json({"message":"There was a problem with this action"});
    }
  }
  
  });
  connection.release();
  });
   
  }
  }
  else{
   res.json({"message":"Only admin can perform this action"});
  }
}
else{
res.json({"message":"You must be logged in to perform this action"});
}

});
  
/*view users*/
app.post('/viewUsers',function(req,res){

var fname = req.body.fname;
var lname = req.body.lname;

user_ses = req.session;
  var id = req.sessionID;
  var username = user_ses.user;
  var type = user_ses.type;
  
  if(user_ses.user) {
  
  if(type == 'admin'){
  
  if(fname == '' && lname == ''){
  
  //var query = "SELECT CONCAT_WS(' ',firstname,lastname) AS 'name' FROM users";
  
  var query = "SELECT firstname AS 'fname',lastname AS 'lname' FROM users";
  
  //connection.query('SELECT firstname,lastname FROM users ', function(err,rows){
  pool.getConnection(function(err,connection) {
  connection.query(query, function(err,rows){
  if(err){
  res.json({"message":"There was an problem with this action"});
  }
  else{
  
  if(rows.length > 0){
  
  /*var names = [];
     for (var i = 0;i < rows.length; i++) {
        //names.push(rows[i].firstname + " " + rows[i].lastname);
        names.push({name:rows[i].firstname + " " + rows[i].lastname});
}*/
  
  res.json({"user_list": rows});

  
  }
  else{
  res.json({"message":"There was a problem with this action"});
  }
  
  }
  
  });
  connection.release();
  });
  
  }
  else{
     var query = "SELECT firstname AS 'fname',lastname AS 'lname' FROM users WHERE firstname LIKE '%"+fname+"%' AND lastname LIKE '%"+lname+"%'";
    //connection.query('SELECT firstname,lastname FROM users WHERE firstname LIKE %?% AND lastname LIKE %?% ',[fname.lname],function(err,rows) { 
    pool.getConnection(function(err,connection) {
     connection.query(query,function(err,rows) {            
		    
		    if(err) {
		      res.json({"message":"There was a problem with this action"});
		    }
		    else {
		    if(rows.length > 0){
		    
		    res.json({"user_list":rows});	
		    
		    }
		    else{
		    res.json({"message":"There was a problem with this action"});
		    }
		      
		    }
  		});
  		connection.release();
  		});
   
  }
  }
  else{
   res.json({"message":"Only admin can perform this action"});
  }
}
else{
res.json({"message":"You must be logged in to perform this action"});
}

});

/*view products*/
app.post('/viewProducts',function(req,res){

var productid = req.body.productId;
var group = req.body.group;
var keyword = req.body.keyword;
var flag = 0;


var query = "SELECT name FROM products ";

if(typeof productid != 'undefined' && productid != ''){

query = query + "WHERE productid ="+productid+"";
flag = 1;

}

if (typeof group != 'undefined' && group != ''){
if (flag == 1){

query = query + " AND product_group LIKE '%"+group+"%'";

}
else{
query = query + "WHERE product_group LIKE '%"+group+"%'";
flag = 1;
}

}
if(typeof keyword != 'undefined' && keyword != ''){
if (flag == 1){

query = query + " AND description LIKE '%"+keyword+"%' OR name LIKE '%"+keyword+"%'";

}
else{
query = query + "WHERE description LIKE '%"+keyword+"%' OR name LIKE '%"+keyword+"%'";
}
}
pool.getConnection(function(err,connection) {
connection.query(query,function(err,rows) {            
		    
		    if(err) {
		      res.json({"message":"There were no products in the system that met that criteria"});
		    }
		    else {
		    if(rows.length > 0){
		    
		    res.json({"product_list":rows});	
		    
		    }
		    else{
		    res.json({"message":"There were no products in the system that met that criteria"});
		    }
		      
		    }
  		});
  		
  		connection.release();
  		});
});

 /* add function */ 
  app.post('/add',function(req,res){
  
  user_ses = req.session;
  var id = req.sessionID;
  
  if(user_ses.user){
  
  var num1 = parseInt(req.body.num1);
  var num2 = parseInt(req.body.num2);
  
  var ans = num1 + num2;
  
  res.json({"answer":ans});
  
  }
  else{
  res.json({"message":"You must be logged in before acccesing this function"});
  }
  
/* multiply function */  
  });
  app.post('/multiply',function(req,res){
  
  user_ses = req.session;
  var id = req.sessionID;
  
  if(user_ses.user){
  
  var num1 = parseInt(req.body.num1);
  var num2 = parseInt(req.body.num2);
  
  var ans = num1 * num2;
  
  res.json({"answer":ans});
  
  }
  else{
  res.json({"message":"You must be logged in before acccesing this function"});
  }
  
  });
   
/*divide function */
app.post('/divide',function(req,res){
  
  user_ses = req.session;
  var id = req.sessionID;
  
  if(user_ses.user){
  
  	var num1 = parseInt(req.body.num1);
  	var num2 = parseInt(req.body.num2);
  
  	if(num2 != 0){
  
 	var ans = num1 / num2;
  
  	res.json({"answer":ans});
  	}

  	else{
  
  	res.json({"error":"The numbers you entered are not valid"});
  	}
  }
  else{
  	res.json({"message":"You must be logged in before acccesing this function"});
  	}
  
  
});
module.exports = app;

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port)

});

