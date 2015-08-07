'use strict';

angular.module('skillMgmtApp').controller('FormSubmissionCtrl', function ($scope, $rootScope, $state, $stateParams, $timeout, alert, FormSubmission, FormSubmissionField, FormSubmissionFieldPerson) {

    $scope.submission = FormSubmission.save({formId: $stateParams.formId, skillId: $stateParams.skillId}, {}, function () {
        if ($scope.submission.state == 'submitted') {
            alert.error('The form has been already been submitted and can\'t be edited anymore.');
            $state.go('form_submission_list');
        }
        $scope.loading = false;
    });

    $scope.saving = false;
    var saved = function () {
        $scope.saving = false;
        $scope.saved = true;
    };

    $scope.loading = true;
    $scope.submitted = false;
    $scope.submitting = false;

    var timeoutsFields = {};
    $scope.fieldChanged = function (field) {
        var updateField = function () {
            $scope.saving = true;
            FormSubmissionField.update({formId: $scope.submission.form.id, skillId: $scope.submission.skill.id}, field, saved);
        };
        if (field.id in timeoutsFields) {
            $timeout.cancel(timeoutsFields[field.id]);
        }
        timeoutsFields[field.id] = $timeout(updateField, 1000);
    };

    $scope.fieldChecked = function (field) {
        $scope.saving = true;
        FormSubmissionField.update({formId: $scope.submission.form.id, skillId: $scope.submission.skill.id}, field, saved);
    };

    var timeoutsFieldPersons = {};
    $scope.fieldPersonChanged = function (field, person) {
        var key = field.id + '_' + person.person.id;
        var updateField = function () {
            $scope.saving = true;
            FormSubmissionFieldPerson.update({
                formId: $scope.submission.form.id,
                skillId: $scope.submission.skill.id,
                fieldId: field.id,
                personId: person.person.id
            }, person, saved);
        };
        if (key in timeoutsFieldPersons) {
            $timeout.cancel(timeoutsFieldPersons[key]);
        }
        timeoutsFieldPersons[key] = $timeout(updateField, 1000);
    };

    $scope.personChecked = function (field, person) {
        $scope.saving = true;
        FormSubmissionFieldPerson.update({
            formId: $scope.submission.form.id,
            skillId: $scope.submission.skill.id,
            fieldId: field.id,
            personId: person.person.id
        }, person, saved);
    };

    $scope.pinChanged = function (field, person) {
        if (person.pin.length == 4) {
            $scope.saving = true;
            FormSubmissionFieldPerson.update({
                formId: $scope.submission.form.id,
                skillId: $scope.submission.skill.id,
                fieldId: field.id,
                personId: person.person.id
            }, person, function (p) {
                person.checked = p.checked;
                if (!person.checked) {
                    person.pin = '';
                }
                saved();
            });
        }
    };

    $scope.submit = function () {
        $scope.submitted = true;
        if ($scope.form.$valid) {
            if (confirm('Please only submit the form if you have filled out all fields. Click OK to proceed.')) {
                $scope.submitting = true;
                $scope.submission.state = 'submitted';
                $scope.submission.$update(function () {
                    alert.success('The form has been submitted successfully.');
                    $state.go('form_submission_list');
                }, function (response) {
                    $scope.submitting = false;
                    alert.error('There was an error submitting the form.');
                    $('body,html').animate({scrollTop: 0});
                });
            }
        } else {
            $('body,html').animate({scrollTop: 0});
        }
    };
});
