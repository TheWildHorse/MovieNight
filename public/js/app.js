'use strict';
var app = angular.module('MovieNight', ['ngRoute', 'toaster', 'ngCookies']);

app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: 'partials/create.html',
            controller: 'CreatePollCtl'
        }).
        when('/poll/:pollId', {
            templateUrl: 'partials/vote.html',
            controller: 'PollVoteCtl'
        });
    }]
);

app.controller('CreatePollCtl', function($scope, $http, toaster, $location) {
    $scope.movieName = {
        0: '',
        1: '',
        2: ''
    };
    $scope.movies = {
        0: '',
        1: '',
        2: ''
    };

    /**
     * Fetches the movie by the written name and updates the model.
     * @param movieId - Id of the movie slot
     */
    $scope.updateMovie = function(movieId) {
        $http({
            method: 'GET',
            url: 'http://www.omdbapi.com/?type=movie&t=' + $scope.movieName[movieId]
        }).then(function successCallback(response) {
            if($scope.movieName[movieId].length >= 2) {
                $scope.movies[movieId] = response.data;
                if($scope.movies[movieId].Poster === undefined || $scope.movies[movieId].Poster.substring(0, 4) != 'http')
                    $scope.movies[movieId].style = {};
                else
                    $scope.movies[movieId].style = {'background-image': 'URL(http://img.omdbapi.com/?i=' + $scope.movies[movieId].imdbID + '&apikey=db496034)'};
            }
            else {
                $scope.movies[movieId] = {};
            }
        }, function errorCallback(response) {
            console.log("Movie search API error occurred.");
            console.log(response);
        });
    }

    $scope.createMoviePoll = function() {
        $http({
            method: 'POST',
            url: '/poll',
            data: {
                movies: [
                    $scope.movies[0],
                    $scope.movies[1],
                    $scope.movies[2]
                ]
            }
        }).then(function successCallback(response) {
            $location.path('/poll/' + response.data.urlID);
        }, function errorCallback(response) {
            toaster.error("Unsuccessful creation!", "Please check that all three movies are set...");
        });
    }
});

app.controller('PollVoteCtl', function($scope, $routeParams, $http, $location, $cookies, $interval) {
    $scope.userName = $cookies.get('userName');
    $scope.userID = $cookies.get('userID');
    $scope.userReady = $scope.userName !== undefined &&  $scope.userID !== undefined;
    $scope.movies = {
        0: '',
        1: '',
        2: ''
    };

    var refreshPoll = function () {
        $http({
            method: 'GET',
            url: '/poll/' + $routeParams.pollId + '/info'
        }).then(function successCallback(response) {
            $scope.movies = response.data.movies;
            $scope.likes = response.data.likes;
        }, function errorCallback(response) {
            $location.path('/');
        });
    };

    $scope.saveName = function () {
        $scope.userID = Math.random().toString(36).substr(2,15);
        $scope.userReady = $scope.userName !== undefined &&  $scope.userID !== undefined;
        if($scope.userReady == true) {
            $cookies.put('userName', $scope.userName);
            $cookies.put('userID', $scope.userID);
        }
        else {
            toaster.error("Unsuccessful validation!", "Please check that you entered an username...");
        }
    }

    $scope.like = function(movieId) {
        $http({
            method: 'POST',
            url: '/poll/' + $routeParams.pollId + '/movies/' + movieId + '/like',
            data: $cookies.getAll()
        }).then(function successCallback(response) {
            refreshPoll();
        }, function errorCallback(response) {
            $location.path('/');
        });
    };

    $scope.getActivityClass = function(movieId) {
        if($scope.likes !== undefined) {
            for(var i = 0; i < $scope.likes[movieId].length; i++) {
                if($scope.likes[movieId][i].userID == $scope.userID)
                    return 'active';
            }
        }
        return '';
    };

    $scope.getLikedNames = function(movieId) {
        var names = [];
        if($scope.likes !== undefined) {
            for (var i = 0; i < $scope.likes[movieId].length; i++) {
                names.push($scope.likes[movieId][i].userName);
            }
        }
        return names;
    };

    $interval(refreshPoll, 500);
});

