// @flow

import { Then, When, } from 'cucumber';

When(/^I go to the dashboard screen$/, async function () {
  await this.click('.stakeDashboard ');
});

When(/^I click on the withdraw button$/, async function () {
  await this.click('.withdrawButton ');
});

Then(/^I should rewards in the history$/, async function () {
  await this.waitForElement('.recharts-bar');
});
