'use strict';

angular.module('skillMgmtApp').controller('SkillPlanCtrl', function ($scope, $rootScope, $state, $stateParams, $timeout, $uibModal, auth, alert, Skill, CompetitionDay, SkillItem) {

    $scope.loading = true;

    $scope.competitionDays = CompetitionDay.query({eventId: $stateParams.eventId});

    $scope.skill = Skill.get({eventId: $stateParams.eventId, id: $stateParams.skillId}, {}, function () {

        auth.user.$promise.then(function () {
            $scope.skills.$promise.then(function () {
                $scope.active.skill = $scope.skill;
            });
        });

        $scope.skillItems = SkillItem.query({skillId: $scope.skill.id}, {}, function () {
            $scope.loading = false;
        });

    });

    $scope.cancelSkillsModal = function () {
        $scope.skillsModal.dismiss('cancel');
    };

    $scope.changeSkill = function () {
        $scope.skillsModal = $uibModal.open({
            templateUrl: 'views/skill_plan_skills.html',
            size: 'sm',
            scope: $scope
        });
    };
});

angular.module('skillMgmtApp').controller('SkillPlanDayCtrl', function ($scope, $rootScope, $state, $stateParams, $filter, $timeout, auth, alert, SkillItem) {

    $scope.competitionDays.$promise.then(function () {
        angular.forEach($scope.competitionDays.days, function (competitionDay) {
            if (competitionDay.timeline == $stateParams.day) {
                $scope.active.day = competitionDay;
            }
        });
    });

    $scope.saving = false;
    var saved = function () {
        $scope.saving = false;
        $scope.saved = true;
    };

    var errored = function (httpResponse) {
        if (httpResponse.status == 401) {
            // Unauthorized

            window.alert('Your session has timed out. The page will now refresh and you might need to login again.');

            // reload page
            window.location.reload(false)

        } else {
            if (httpResponse.data.user_msg) {
                window.alert('Error: ' + httpResponse.data.user_msg);
            } else {
                window.alert('An error has occured: ' + JSON.stringify(httpResponse.data));
            }
        }
        $scope.saving = false;
    };

    var timeoutsItems = {};
    $scope.itemChanged = function (item) {
        var updateItem = function () {
            $scope.saving = true;
            if (item.id) {
                SkillItem.update({skillId: $stateParams.skillId}, item, saved, errored);
            } else {
                SkillItem.save({skillId: $stateParams.skillId}, item, function (response) {
                    item.id = response.id;
                    saved();
                }, errored);
            }
        };
        if (item.id in timeoutsItems) {
            $timeout.cancel(timeoutsItems[item.id]);
        }
        timeoutsItems[item.id] = $timeout(updateItem, 1000);
    };

    $scope.addItem = function () {

        var newItem = {
            timeline: $scope.active.day.timeline,
            order_num: $scope.filteredItems.length + 1,
            description: {
                lang_code: 'en',
                text: ''
            },
            responsibility: '',
            skill: $scope.skill
        };
        $scope.skillItems.items.push(newItem);
    };

    $scope.removeItem = function (item) {
        var index = $scope.skillItems.items.indexOf(item);
        $scope.skillItems.items.splice(index, 1);
        SkillItem.delete({skillId: $stateParams.skillId}, item);
    };

    $scope.moveItemUp = function (orderNum, item) {
        var index = $scope.skillItems.items.indexOf(item);
        var newItem = $scope.skillItems.items[index];
        var oldItem = $scope.skillItems.items[index - 1];
        $scope.skillItems.items[index - 1] = newItem;
        $scope.skillItems.items[index] = oldItem;
        newItem.order_num = orderNum - 1;
        oldItem.order_num = orderNum;
        $scope.itemChanged(newItem);
        $scope.itemChanged(oldItem);
    };

    $scope.moveItemDown = function (orderNum, item) {
        var index = $scope.skillItems.items.indexOf(item);
        var newItem = $scope.skillItems.items[index];
        var oldItem = $scope.skillItems.items[index + 1];
        $scope.skillItems.items[index + 1] = newItem;
        $scope.skillItems.items[index] = oldItem;
        newItem.order_num = orderNum + 1;
        oldItem.order_num = orderNum;
        $scope.itemChanged(newItem);
        $scope.itemChanged(oldItem);
    };
});

