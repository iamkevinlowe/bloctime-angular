angular.module('blocTime', ['filters', 'services'])
  .controller('MainCtrl', ['$scope', '$interval', 'MY_CONSTANTS', 'Tasks', function($scope, $interval, MY_CONSTANTS, Tasks) {
    $scope.seconds = MY_CONSTANTS.TIMES.WORK;
    $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.WORK;

    var onBreak = false;
    var timerInterval = null;
    var timesCompleted = 0;
    var sound = new buzz.sound('/assets/sounds/elevator-ding.mp3', {
      preload: true
    });
    $scope.toggleButton = function() {
      if ($scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.WORK || $scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.REST) {
        $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.RESET;

        timerInterval = $interval(function() {
          if ($scope.seconds !== 0) {
            $scope.seconds--;
          } else if ($scope.seconds <= 0) {
            $interval.cancel(timerInterval);
            timerInterval = null;

            if (onBreak) {
              $scope.seconds = MY_CONSTANTS.TIMES.WORK;
              $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.WORK;
              onBreak = false;
            } else {
              if (++timesCompleted === 4) {
                timesCompleted = 0;
                $scope.seconds = MY_CONSTANTS.TIMES.LONGREST;
              } else {
                $scope.seconds = MY_CONSTANTS.TIMES.REST;
              }
              $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.REST;
              onBreak = true;
            }
          }
        }, 1000);
      } else if ($scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.RESET) {
        if (onBreak) {
          $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.REST;
          $scope.seconds = MY_CONSTANTS.TIMES.REST;
        } else {
          $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.WORK;
          $scope.seconds = MY_CONSTANTS.TIMES.WORK;
        }

        $interval.cancel(timerInterval);
        timerInterval = null;
      }
    };
    $scope.$watch('seconds', function(newVal) {
      if (newVal === 0) {
        sound.play();
      }
    })

    $scope.tasks = Tasks.all;
    $scope.addTask = function() {
      $scope.tasks.$add({task: $scope.task});
      $scope.task = "";
    };
  }])
  .directive('timer', function() {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/timer.html'
    };
  })
  .constant('MY_CONSTANTS', {
    TIMES: {
      WORK: 1500,
      REST: 300,
      LONGREST: 1800
    },
    BUTTON_LABELS: {
      WORK: 'Start Work',
      REST: 'Take Break',
      RESET: 'Reset'
    }
  });

angular.module('filters', [])
  .filter('timer', function() {
    return function(seconds) {
      var minutes = Math.floor(seconds / 60) + "";
      var seconds = Math.floor(seconds % 60) + "";

      if (seconds.length <= 1) {
        seconds = "0" + seconds;
      }

      return (minutes + ":" + seconds);
    };
  });

angular.module('services', ['firebase'])
  .factory('Tasks', ['$firebaseArray', function($firebaseArray) {
    var ref = new Firebase('https://blazing-fire-9765.firebaseio.com/');

    var tasks = $firebaseArray(ref);

    return {
      all: tasks
    };
  }]);