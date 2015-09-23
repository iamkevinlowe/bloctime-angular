angular.module('blocTime', ['filters', 'services'])
  .controller('MainCtrl', ['$scope', 'Timer', 'Tasks', function($scope, Timer, Tasks) {
    $scope.seconds = Timer.getWorkTime();
    $scope.buttonWork = Timer.getWorkLabel();
    $scope.buttonRest = Timer.getRestLabel();
    $scope.onBreak = false;

    $scope.tasks = Tasks.all;
    $scope.addTask = function() {
      $scope.tasks.$add({task: $scope.task});
      $scope.task = "";
    };
  }])
  .directive('timer', ['$interval', 'Timer', function($interval, Timer) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/timer.html',
      controller: function($scope) {
        $scope.toggleWork = function() {
          if ($scope.buttonWork === Timer.getWorkLabel()) {
            Timer.startTimer($scope);
          } else if ($scope.buttonWork === Timer.getResetLabel()) {
            Timer.resetTimer($scope);
          }
        };
        $scope.toggleRest = function() {
          if ($scope.buttonRest === Timer.getRestLabel()) {
            Timer.startTimer($scope);
          } else if ($scope.buttonRest === Timer.getResetLabel()) {
            Timer.resetTimer($scope);
          }
        };
        $scope.$watch('seconds', function(newVal) {
          if (newVal === 0) {
            Timer.playSound();
          }
        });
      }
    };
  }]);

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
  .value('TIMES', {
    WORK: 1500,
    REST: 300,
    LONGREST: 1800
  })
  .value('LABELS', {
    WORK: 'Start Work',
    REST: 'Take Break',
    RESET: 'Reset'
  })
  .service('Timer', ['TIMES', 'LABELS', '$interval', function(TIMES, LABELS, $interval) {
    var timerInterval = null;
    var timesCompleted = 0;
    var sound = new buzz.sound('/assets/sounds/elevator-ding.mp3', {
      preload: true
    });

    return {
      getWorkTime: function() {
        return TIMES.WORK;
      },
      getRestTime: function() {
        return TIMES.REST;
      },
      getWorkLabel: function() {
        return LABELS.WORK;
      },
      getRestLabel: function() {
        return LABELS.REST;
      },
      getResetLabel: function() {
        return LABELS.RESET;
      },
      startTimer: function(scope) {
        scope.onBreak ? scope.buttonRest = LABELS.RESET : scope.buttonWork = LABELS.RESET;

        timerInterval = $interval(function() {
          if (scope.seconds !== 0) {
            scope.seconds--;
          } else if (scope.seconds <= 0) {
            $interval.cancel(timerInterval);
            timerInterval = null;

            if (scope.onBreak) {
              scope.seconds = TIMES.WORK;
              scope.buttonWork = LABELS.WORK;
              scope.onBreak = false;
            } else {
              if (++timesCompleted === 4) {
                timesCompleted = 0;
                scope.seconds = TIMES.LONGREST;
              } else {
                scope.seconds = TIMES.REST;
              }
              scope.buttonRest = LABELS.REST;
              scope.onBreak = true;
            }
          }
        }, 1000);
      },
      resetTimer: function(scope) {
        if (scope.onBreak) {
          scope.buttonRest = LABELS.REST;
          scope.seconds = TIMES.REST;
        } else {
          scope.buttonWork = LABELS.WORK;
          scope.seconds = TIMES.WORK;
        }

        $interval.cancel(timerInterval);
        timerInterval = null;
      },
      playSound: function() {
        sound.play();
      }
    };
  }])
  .factory('Tasks', ['$firebaseArray', function($firebaseArray) {
    var ref = new Firebase('https://blazing-fire-9765.firebaseio.com/');

    var tasks = $firebaseArray(ref);

    return {
      all: tasks
    };
  }]);