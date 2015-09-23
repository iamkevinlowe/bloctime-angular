angular.module('blocTime', ['filters'])
  .controller('MainCtrl', ['$scope', '$interval', function($scope, $interval) {
    $scope.timerData = {
      seconds: 1500,
      buttonLabel: "Start"
    };
  }])
  .directive('timerCountdown', ['$interval', function($interval) {

    var timerInterval = null;

    function startTimer(scope) {
      timerInterval = $interval(function() {
        if (scope.data.seconds !== 0) {
          scope.data.seconds--;
        } else {
          timesUp(scope);
        }
      }, 1000);
      scope.data.buttonLabel = "Reset";
    }

    function resetTimer(scope) {
      $interval.cancel(timerInterval);
      timerInterval = null;
      scope.data = {
        seconds: 1500,
        buttonLabel: "Start"
      };
    }

    function timesUp(scope) {
      $interval.cancel(timerInterval);
      timerInterval = null;
      alert("Time's up!");
    }

    function link(scope, element, attrs) {

      scope.onTimerClick = function() {
        if (scope.data.buttonLabel === "Start")
          startTimer(scope);
        else if (scope.data.buttonLabel === "Reset")
          resetTimer(scope);
      }
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/timer-countdown.html',
      scope: {
        data: '=timerData'
      },
      link: link
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