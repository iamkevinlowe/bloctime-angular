angular.module('blocTime', ['filters', 'services'])
  .controller('MainCtrl', ['$scope', '$interval', 'MY_CONSTANTS', 'Tasks', function($scope, $interval, MY_CONSTANTS, Tasks) {
    $scope.seconds = MY_CONSTANTS.TIMES.WORK;
    $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.WORK;
    $scope.buttonPause = MY_CONSTANTS.BUTTON_LABELS.PAUSE;

    $scope.tasks = Tasks.all;
    $scope.task = {
      name: "",
      workSessions: 1
    };

    $scope.currentTask = "";
    $scope.sessionsCompleted = 0;
    $scope.interruptions = 0;

    $scope.stopped = true;
    $scope.timer = 'analog';

    $scope.degreesSeconds = (MY_CONSTANTS.TIMES.WORK % 60) * 6;
    $scope.degreesMinutes = (MY_CONSTANTS.TIMES.WORK / 60) * 6;

    $scope.$watch('seconds', function(newVal) {
      if (newVal === 0) {
        sound.play();
      }
    });
    $scope.tasks.$watch(function(event) {
      getCurrentTask();
    });
    
    $scope.toggleButton = function() {
      if ($scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.WORK || $scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.REST) {
        $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.RESET;
        $scope.stopped = false;

        startTimer();
      } else if ($scope.buttonLabel === MY_CONSTANTS.BUTTON_LABELS.RESET) {
        if (onBreak) {
          ($scope.sessionsCompleted % 4 === 0) ? rest('long') : rest()
        } else {
          $scope.interruptions++;
          work();
        }
        stopTimer();
      }
    };
    $scope.togglePause = function() {
      ($scope.buttonPause === MY_CONSTANTS.BUTTON_LABELS.PAUSE) ? stopTimer('paused') : startTimer()
    };

    $scope.addTask = function() {
      $scope.tasks.$add({
        name: $scope.task.name,
        workSessions: $scope.task.workSessions,
        complete: false,
        created_at: Date.now()
      });
      $scope.task = {
        name: "",
        workSessions: 1
      };
    };
    $scope.deleteTask = function(task) {
      $scope.tasks.$remove(task);
    };

    var onBreak = false;
    var timerInterval = null;
    var sound = new buzz.sound('/assets/sounds/elevator-ding.mp3', {
      preload: true
    });

    var work = function() {
      $scope.seconds = MY_CONSTANTS.TIMES.WORK;
      $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.WORK;

      $scope.degreesSeconds = (MY_CONSTANTS.TIMES.WORK % 60) * 6;
      $scope.degreesMinutes = (MY_CONSTANTS.TIMES.WORK / 60) * 6;
    };
    var rest = function(option) {
      if (typeof option === 'undefined') {
        $scope.seconds = MY_CONSTANTS.TIMES.REST;

        $scope.degreesSeconds = (MY_CONSTANTS.TIMES.REST % 60) * 6;
        $scope.degreesMinutes = (MY_CONSTANTS.TIMES.REST / 60) * 6;
      } else if (option === 'long') {
        $scope.seconds = MY_CONSTANTS.TIMES.LONGREST;

        $scope.degreesSeconds = (MY_CONSTANTS.TIMES.LONGREST % 60) * 6;
        $scope.degreesMinutes = (MY_CONSTANTS.TIMES.LONGREST / 60) * 6;
      }
      $scope.buttonLabel = MY_CONSTANTS.BUTTON_LABELS.REST;
    };
    var startTimer = function() {
      $scope.buttonPause = MY_CONSTANTS.BUTTON_LABELS.PAUSE;

      timerInterval = $interval(function() {
        if ($scope.seconds !== 0) {
          $scope.seconds--;
          $scope.degreesSeconds = ($scope.seconds % 60) * 6;
          $scope.degreesMinutes = ($scope.seconds / 60) * 6;
        } else if ($scope.seconds <= 0) {
          if (onBreak) {
            work();
            onBreak = false;
          } else {
            (++$scope.sessionsCompleted % 4 === 0) ? rest('long') : rest()
            $scope.interruptions = 0;
            onBreak = true;
            checkCurrentTask();
          }
          stopTimer();
        }
      }, 1000);
    };
    var stopTimer = function(option) {
      if (typeof option === 'undefined') {
        $scope.stopped = true;
      } else if (option === 'paused') {
        $scope.interruptions++;
        $scope.buttonPause = MY_CONSTANTS.BUTTON_LABELS.RESUME;
      }

      $interval.cancel(timerInterval);
      timerInterval = null;
    };
    var getCurrentTask = function() {
      $scope.tasks.$loaded().then(function(array) {
        for (i = 0; i < array.length; i++) {
          if (array[i].complete === false) {
            $scope.currentTask = array[i];
            return;
          }
        }
        $scope.currentTask = {
          name: 'No More Tasks'
        }
      });
    };
    var checkCurrentTask = function() {
      if ($scope.sessionsCompleted >= $scope.currentTask.workSessions) {
        $scope.currentTask.complete = true;
        $scope.tasks.$save($scope.currentTask).then(function() {
          $scope.sessionsCompleted = 0;
        });
      }
    };
  }])
  .directive('timerDigital', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/timer.html'
    };
  })
  .directive('timerAnalog', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/timer-analog.html'
    }
  })
  .directive('taskList', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/task-list.html'
    }
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
      RESET: 'Reset',
      PAUSE: 'Pause',
      RESUME: 'Resume'
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