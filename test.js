const mongoose = require("mongoose"),
    Agency = require("./app/models/Agency"),
    Snapshot = require("./app/models/Snapshot"),
    request = require('request'),
    convert = require('xml-js'),
    geocoder = require('node-geocoder')({
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY
    }),
    {Builder, By, Key, until} = require('selenium-webdriver'),
    chrome = require('selenium-webdriver/chrome');

// ** Initialize web scraper **
const options = new chrome.Options();
options.addArguments("--headless");
options.addArguments("--disable-gpu");
options.addArguments("--no-sandbox");

let driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();


async function getVideoRequest(url) {
  await driver.get(url);
  try{
    await driver.wait(function () {
      return driver.findElements(By.xpath ("//*[contains(text(),'Total Video Requests')]")).then(found => !!found.length);
    }, 3000);
    let element = await driver.findElement(By.xpath ("//*[contains(text(),'Total Video Requests')]"));
    let text = await element.getText();
    let numVideoRequests = parseInt(text.split(":")[1].trim());
    return numVideoRequests;
  }
  catch(error){
    console.log(url);
    console.log(error);
    return 0;
  }
}

async function test(){
  let x = await(getVideoRequest("https://agency.ring.com/agencies/9549f620-d3a2-400e-ad9e-7e56967f0244"));
  console.log(x);
}

test();
