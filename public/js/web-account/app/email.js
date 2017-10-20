gilt.define('app.email', ['vendor.jquery', 'dom.dialog', 'vendor.handlebars', 'common.message', 'common.page_controller', 'common.request', 'tracking.web_account'], function (_vendor, _dom, _vendor2, _common, _common2, _common3, _tracking) {
  'use strict';

  var exports = {};

  var $ = _interopRequireDefault(_vendor).default;

  var Dialog = _interopRequireDefault(_dom).default;

  var Handlebars = _interopRequireDefault(_vendor2).default;

  var message = _interopRequireDefault(_common).default;

  var pageController = _interopRequireDefault(_common2).default;

  var request = _interopRequireDefault(_common3).default;

  var tracking = _interopRequireDefault(_tracking).default;

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var userGuid = void 0;
  var unsubDialog = void 0;

  function _initToggleCities() {
    $('input[name="city_dsr"]').on('click', function (e) {
      if (e.currentTarget.value !== 'unsubscribed') {
        $('.cities').slideDown('slow');
      } else {
        $('.cities').slideUp('slow');
      }
    });
  }

  function _postPreferences() {
    var apiPath = pageController.getProperty('publicApiAccountPath') + '/user/:user_guid/email_subscriptions';
    apiPath = apiPath.replace(':user_guid', userGuid);

    function getOptions(input) {
      var array = [];
      for (var i = 0; i < input.length; i++) {
        array.push(input[i].value);
      }
      return array;
    }

    var giltDsr = $('input:radio[name=gilt_dsr]:checked').val();
    var cityDsr = $('input:radio[name=city_dsr]:checked').val();
    var citySubs = $('input:checkbox[name=city_subscriptions]:checked');
    var optInOptions = $('input:checkbox[name=opt_in_options]:checked');

    var opts = {
      type: 'post',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
        gilt_dsr: giltDsr,
        city_dsr: cityDsr,
        city_subscriptions: getOptions(citySubs),
        opt_in_options: getOptions(optInOptions)
      }),
      processData: false,
      validate: true,
      parse: true,
      emulateHTTP: false,
      emulateJSON: false
    };

    $('.loader').addClass('active');
    return request.post(apiPath, opts.data, opts).then(function () {
      $('.loader').removeClass('active');
      $('.response-message').text(message.get('web_account', 'email_preferences_success')).removeClass('hidden');
    }).otherwise(function () {
      $('.loader').removeClass('active');
      $('.response-message').text(message.get('web_account', 'email_preferences_error')).addClass('error').removeClass('hidden');
    });
  }

  function _initSubmitPreferences() {
    var $formAreaCitiesError = $('.form-area.cities .error');
    $('.email-page .button-large-primary').on('click', function (e) {
      e.preventDefault();
      if ($('input[name="city_dsr"][value!="unsubscribed"]').is(':checked') && !$('input[name="city_subscriptions"]').is(':checked')) {
        $formAreaCitiesError.removeClass('hidden');
        $('html, body').animate({ scrollTop: 500 }, { duration: 100 });
      } else {
        $formAreaCitiesError.addClass('hidden');
        _postPreferences();
        $('html, body').animate({ scrollTop: 0 }, { duration: 100 });
      }
    });
  }

  function _deletePreferences() {
    var apiPath = pageController.getProperty('publicApiAccountPath') + '/user/:user_guid/email_subscriptions';
    apiPath = apiPath.replace(':user_guid', userGuid);

    var opts = {
      type: 'delete',
      processData: false,
      validate: true,
      parse: true,
      emulateHTTP: false,
      emulateJSON: false
    };

    $('.loader').addClass('active');
    return request.delete(apiPath, opts).then(function () {
      // do a get on the api again.
      request.get('/web-account/user/email_preferences').then(function (emailData) {
        // replace container with output from handlebars
        var html = Handlebars.templates['email/_email'](emailData);
        var section = $('#main_col');
        section.html(html);
        $('.loader').removeClass('active');
        $('.response-message').text(message.get('web_account', 'email_preferences_unsub_success')).removeClass('hidden');
        _initSubmitPreferences();
        _initToggleCities();
        $('.unsubscribe-all').on('click', function () {
          unsubDialog.open();
        });
      }).otherwise(function () {
        $('.loader').removeClass('active');
        $('.response-message').text(message.get('web_account', 'email_preferences_error')).addClass('error').removeClass('hidden');
      });
    });
  }

  var _buttonClickHandler = function _buttonClickHandler(ev) {
    ev.preventDefault();
    var $target = $(ev.target);
    if ($target.hasClass('confirm')) {
      _deletePreferences();
    }
    unsubDialog.close();
  };

  function init() {
    userGuid = pageController.getProperty('userGuid');
    message.init().then(function () {
      unsubDialog = new Dialog({
        template: 'src/confirm_dialog',
        className: 'generic-confirm-dialog',
        modal: true,
        theme: 'nouveau',
        data: {
          msg: message.get('web_account', 'confirm_unsub'),
          buttonText: message.get('action', 'save')
        }
      });
      unsubDialog.subscribe('closed', function () {
        var $elementButtons = $(unsubDialog.element);
        $elementButtons.off('click', _buttonClickHandler);
      });

      unsubDialog.subscribe('opened', function () {
        var $elementButtons = $(unsubDialog.element);
        $elementButtons.on('click', _buttonClickHandler);
      });

      $('.unsubscribe-all').on('click', function () {
        unsubDialog.open();
      });
    });
    _initSubmitPreferences();
    _initToggleCities();

    tracking.init();

    $('.contact a').click(function () {
      tracking.contact({
        scope: 'orders',
        type: 'cs'
      });
    });
  }

  exports.default = {
    version: '$$PACKAGE_VERSION$$',
    init: init
  };
  return exports.default;
});
//# sourceMappingURL=email.js.map
