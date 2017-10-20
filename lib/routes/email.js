'use strict';

module.exports = function (app) {
  const basicChassisOptions = {
    chassis: {
      navigation: true,
      footer: true,
      i18n: true,
      data: true,
      accountNavigation: true
    }
  };

  const env = (process.env.GILT_ENV || 'production').toLowerCase();
  const req = app.utils.request;
  const _ = require('underscore');
  const appHelpers = require('../util/appHelpers.js')(app, env);

  function renderEmailPreferences(subscription) {
    function getSubscriptions(dsrType, description) {
      const cadence = ['daily', 'weekly', 'unsubscribed'];
      const dsrArray = [];
      cadence.forEach((frequency) => {
        dsrArray.push({
          value: frequency,
          checked: dsrType === frequency
        });
        return dsrArray;
      });
      for (let i = 0; i < dsrArray.length; i++) {
        if (dsrArray[i].value === 'daily') {
          dsrArray[i].description_key = description;
        }
        return dsrArray;
      }
      dsrType = dsrArray;
      return dsrType;
    }
    function getOptInOptions(subscriptionArray, preferences) {
      const preferencesArray = [];
      subscriptionArray.forEach((options) => {
        preferencesArray.push({
          value: options,
          checked: preferences.includes(options)
        });
        return preferencesArray;
      });

      preferences = preferencesArray;
      return preferences;
    }

    // render preferences in handlebars
    subscription.result = {
      hide_cities: subscription.result.city_dsr === 'unsubscribed',
      gilt_dsr_options: getSubscriptions(subscription.result.gilt_dsr, '5-8_week'),
      city_dsr_options: getSubscriptions(subscription.result.city_dsr, '1-4_week'),
      city_subscriptions: getOptInOptions(['national', 'houston', 'san-diego', 'atlanta', 'los-angeles', 'san-francisco', 'boston', 'miami', 'seattle', 'chicago', 'newyork', 'dc', 'dallas', 'philadelphia'], subscription.result.city_subscriptions),
      opt_in_options: getOptInOptions(['waitlist_recommendations', 'special_offers', 'cart_reminders', 'sent_invite_updates', 'home_announcements'], subscription.result.opt_in_options)
    };
    return subscription.result;
  }

  function* getEmailSubscriptions(ctx) {
    // Get subscription api Uri from the package.json
    let subscriptionUrl = app.package.gilt.app.apiAccount[env];

    subscriptionUrl += `/user/${appHelpers.getUserGuid(ctx)}/email_subscriptions`;

    const subscription = yield req(subscriptionUrl,
      {
        method: 'get',
        headers: ctx.request.header,
        httpEnvelope: true
      });

    if (subscription.http.code > 399) {
      // TODO: Some proper error handling on the page in the event of api down
      app.log.error('Invalid response received from web account email subscriptions api.');
      return { noDataReceived: true };
    }
    // render these preferences on the page

    return renderEmailPreferences(subscription);
  }

  return {
    get: {
      // The alias prefix from the package.json is prepended to each route described here (e.g. '/checkout')
      '/email': {
        fn: function* email(next, controller, locals) {
          const renderData = {};
          const currentPageRegexp = /email/;
          const localizedStrings = this.i18n;

          locals.metaData = locals.metaData || {};
          locals.metaData.title = `${localizedStrings.web_account_email_preferences.value} / Gilt`;
          renderData.account_nav_tabs = yield appHelpers.getLeftNavigation(this, currentPageRegexp);

          // Lets munge everything together into our renderdata, locals, template vars, accountNavigation
          const emailPreferences = yield getEmailSubscriptions(this);

          _.extend(renderData, appHelpers.getAppTemplateVars(this), this.chassisData.userAccountNav, locals, emailPreferences, {
            userGuid: appHelpers.getUserGuid(this)
          });

          yield this.render('email', renderData);
          yield next;
        },
        options: basicChassisOptions
      },
      // Get all the data from api-account, then put it in the format that
      // handlebars expects.
      '/user/email_preferences': {
        fn: function* viewModelProxy(next) {
          this.set('Content-type', 'application/json');
          this.body = yield getEmailSubscriptions(this);
          yield next;
        },
        options: {
          chassis: {
            navigation: false,
            footer: false,
            i18n: true,
            data: false
          }
        }
      }
    }
  };
};
