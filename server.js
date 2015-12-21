var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

app.use(express.static('public'));
app.use(bodyParser.json());
var DBURL = 'mongodb://localhost:27017/movienight';

var MongoExecute = function(executeFunction) {
    MongoClient.connect(DBURL, function(err, db) {
        assert.equal(null, err);
        executeFunction(err, db);
    });
}

/*
 * ROUTES
 */
app.post('/poll', function(req, res){
    var payload = req.body;
    if(payload.movies[0] && payload.movies[1] && payload.movies[2]) {
        var pollModel = {
            urlID: Math.random().toString(36).substr(2,8),
            movies: [
                payload.movies[0],
                payload.movies[1],
                payload.movies[2]
            ],
            likes: [
                [],
                [],
                []
            ],
        }
        MongoExecute(function(err, db) {
            db.collection('polls').insertOne(pollModel, function(err, result) {
                assert.equal(err, null);
                console.log("New poll created - ID: " + pollModel.urlID );
                db.close();
                res.status(200);
                res.json({urlID: pollModel.urlID});
            });
        });
    }
    else {
        res.status(400);
        res.send("Missing parameters.");
    }
});

app.get('/poll/:urlID/info', function(req, res) {
    MongoExecute(function(err, db) {
        db.collection('polls').findOne(
            { urlID: req.params.urlID },
            function(err, doc) {
                assert.equal(err, null);
                db.close();
                if(doc == null) {
                    res.status(404);
                    res.send("Poll not found.");
                }
                else {
                    res.json(doc);
                }
            }
        );
    });
});

app.post('/poll/:urlID/movies/:movieID/like', function(req, res) {
    var payload = req.body;
    if(payload.userName && payload.userID) {
        MongoExecute(function(err, db) {
            db.collection('polls').findOne(
                { urlID: req.params.urlID },
                function(err, doc) {
                    assert.equal(err, null);
                    if(doc != null) {
                        var found = -1;
                        for(var i = 0; i < doc.likes[req.params.movieID].length; i++)
                            if(doc.likes[req.params.movieID][i].userName == payload.userName)
                                found = i;
                        if(found == -1)
                            doc.likes[req.params.movieID].push({ userName: payload.userName, userID: payload.userID });
                        else
                            doc.likes[req.params.movieID].splice(found, 1);

                        db.collection('polls').updateOne(
                            { urlID: req.params.urlID },
                            doc,
                            function(err, doc) {
                                assert.equal(err, null);
                                res.json({error: false});
                                db.close();
                            }
                        );
                    }
                    else {
                        res.status(404);
                        res.send("Poll not found.");
                    }
                }
            );
        });
    }
    else {
        res.status(400);
        res.send("Missing parameters.");
    }
});

app.listen(3001);
console.log("App is listening on port 3001.")





