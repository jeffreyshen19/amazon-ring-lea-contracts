const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

let options = new chrome.Options();
options.addArguments("--headless");
options.addArguments("--disable-gpu");
options.addArguments("--no-sandbox");

let driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();

async function getVideoRequest(url) {
  await driver.get(url);
  await driver.wait(until.titleContains('Neighbors -'), 1000);
  let element = await driver.findElement(By.className('Bcbby'));
  let text = await element.getText();
  let numVideoRequests = parseInt(text.split(":")[1].trim());

  return numVideoRequests;
}

getVideoRequest("https://agency.ring.com/agencies/40b71f16-daff-453d-a1bf-ed0c021e4283")
