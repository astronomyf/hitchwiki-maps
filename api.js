/*
 *  Hitchwiki maps - API routes
 *  api.js is where all the api routes are created
 *  will serve to show datas from the database in JSON format
 *  will also be used to add, remove or edit a spot by the server
 *  just by calling the specific routes
 */

//Require connection file
const app = require('./app.js');
//Require File System - used to open html file of api index
const fs = require('fs');

//const async = require('async');

app.get('/api', (req, res) => {
    fs.readFile('api.html', (err, data) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

/*
 *  READ ONLY ROUTES
 *  I'm just using the same names of the current api
 */

 //Error message
 var message_error = {"status": "failed", "message": "Unable to fetch data"};  

/* 
 *  Get all info about a place
 *  /api/place/PLACE_ID
 */

app.get('/api/place/:id', (req, res) => {
    var id = req.params.id;
    var ContinentsNames = ["Europe", "North America", "South America", "Asia", "Africa", "Oceania", "Antarctica"];

    if(!isNaN(id)) {

    //First query --> Fetch point main data, country data and user data
    let query = 'SELECT t_points.id, t_points.lat, t_points.lon, t_points.elevation, t_points.waitingtime, t_points.waitingtime_count, t_points.locality, t_points.country, t_points.continent, t_points.datetime, t_points.rating, t_points.rating_count, t_users.id AS userId, t_users.name, t_countries.en_UK FROM t_points LEFT JOIN t_users ON t_points.user = t_users.id LEFT JOIN t_countries ON t_points.country = t_countries.iso WHERE t_points.id = ?';

    db.query(query, id, (err, res1) => {
      var numRows = res1.length;
      if(numRows > 0) {
        if(err) {
             res.json(message_error);
        } else {
            var ContinentName;
            switch(res1[0].continent) {
                case "EU": 
                    ContinentName = ContinentsNames[0];
                    break;
                case "NA":
                    ContinentName = ContinentsNames[1];
                    break;
                case "SA":
                    ContinentName = ContinentsNames[2];
                    break;
                case "AS":
                    ContinentName = ContinentsNames[3];
                    break;
                case "AF":
                    ContinentName = ContinentsNames[4];
                    break;
                case "OC":
                    ContinentName = ContinentsNames[5];
                    break;
                case "AN":
                    ContinentName = ContinentsNames[6];
                    break;
                default:
                    ContinentName = null;
                    break;
            }
            //Second query --> Fetch all ratings from single point
            let query = 'SELECT t_ratings.rating, COUNT(t_ratings.rating) AS rating_count FROM t_ratings LEFT JOIN t_points ON t_ratings.fk_point = t_points.id WHERE t_points.id = ? GROUP BY t_ratings.rating';
            
            db.query(query, [id], (err, res2) => {
                if(err) {
                    res.json(message_error);
                } else {
                    //Third query --> Count different waiting times from single point
                    let query = "SELECT COUNT(DISTINCT t_waitingtimes.waitingtime) AS count_times FROM t_waitingtimes LEFT JOIN t_points ON t_waitingtimes.fk_point = t_points.id WHERE t_points.id  = ?";
                    
                    db.query(query, id, (err, res3) => {
                        if(err) {
                            res.json(message_error);
                        } else {
                            //Fourth query --> Fetch point description
                            let query = "SELECT t_points_descriptions.language, t_points_descriptions.datetime, t_points_descriptions.description, COUNT(t_points_descriptions.description) AS versions FROM t_points_descriptions LEFT JOIN t_points ON t_points_descriptions.fk_point = t_points.id WHERE t_points.id = ? GROUP BY t_points_descriptions.language";

                            db.query(query, [id], (err, res4) => {
                                if(err) {
                                    res.json(message_error);
                                } else {
                                    //Fifth and last query --> Fetch point comments
                                    let query = "SELECT  t_comments.id ,  t_comments.fk_user AS userId,  t_comments.nick ,  t_comments.comment ,  t_comments.datetime  FROM  t_comments  LEFT JOIN  t_points  ON  t_comments.fk_place  =  t_points.id  WHERE t_points.id = ?";
                                    
                                    db.query(query, [id], (err, res5) => {
                                        var comments_count = res5.length;
                                        if(err) {
                                            console.log(err);
                                        } else {
                                            //Final JSON structure
                                            res.json({
                                                id: res1[0].id,
                                                lat: res1[0].lat,
                                                lon: res1[0].lon,
                                                elevation: res1[0].elevation,
                                                location: {
                                                    locality: res1[0].locality,
                                                    country: {
                                                        iso: res1[0].country,
                                                        name: res1[0].en_UK
                                                    },
                                                    continent: {
                                                        code: res1[0].continent,
                                                        name: ContinentName
                                                    }
                                                },
                                                user: {
                                                    id: res1[0].userId,
                                                    name: res1[0].name
                                                },
                                                creation_date: res1[0].datetime,
                                                rating: res1[0].rating,
                                                rating_count: res1[0].rating_count,
                                                rating_stats: res2,
                                                waiting_stats: {
                                                    average: res1[0].waitingtime,
                                                    count: res1[0].waitingtime_count,
                                                    different_times: res3[0].count_times
                                                },
                                                description: res4,
                                                comments: res5,
                                                comments_count: comments_count
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
      } else {
        res.json(message_error);
      }
    })
    } else {
        res.json(message_error);
    }
});


/*  
 *   Get basic info about a place
 *  /api/place/PLACE_ID&dot
 */

app.get('/api/place/:id&dot', (req, res) => {
    var id = req.params.id;
    var query = "SELECT id, lat, lon, rating FROM  t_points  WHERE id = ?";
    
    db.query(query, [id], (err, rows) => {
        if(err) {
            res.json(message_error);
        } else {
            res.json(rows);
        }
    });
});

/*  
 *   Get places by city
 *  /api/city/:name
 */

 app.get('/api/city/:name', (req, res) => {
    var name = req.params.name;
    let query = "SELECT  id ,  lat ,  lon ,  rating  FROM  t_points  WHERE  locality  = ?";
    
    db.query(query, [name], (err, rows) => {
        if(err) {
            res.json(message_error);
        } else {
            res.json(rows);
        }
    });
 });

 /*  
  *  Get places by country
  *  /api/country/:iso
  */

 app.get('/api/country/:iso', (req, res) => {
    var iso = req.params.iso;
    let query = "SELECT  id ,  lat ,  lon ,  rating  FROM  t_points  WHERE  country  = ?";
    
    db.query(query, [iso], (err, rows) => {
        if(err) {
            res.json(message_error);
        } else {
            res.json(rows);
        }
    });
 });

 /*  
  *  Get places by continent
  *  /api/continent/:code
  */

 app.get('/api/continent/:code', (req, res) => {
    var code = req.params.code;
    let query = "SELECT  id ,  lat ,  lon ,  rating  FROM  t_points  WHERE  continent  = ?";
    
    db.query(query, [code], (err, rows) => {
        if(err) {
            res.json(message_error);
        } else {
            res.json(rows);
        }
    });
 });