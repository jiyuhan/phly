var http = require('http');
var mysql = require('mysql');
var https = require('https');
var htmlparser = require("htmlparser2");
var schedule = require('node-schedule');
const webdriver = require('selenium-webdriver');
var cheerio = require('cheerio');

let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

// sample url: https://www.kayak.com/flights/COU-SFO/2017-10-16/2017-10-19
var baseUrl = 'https://www.kayak.com/flights/';

var connection = mysql.createConnection({
  host: 'phly.c7jx0v6pormd.us-east-1.rds.amazonaws.com',
  user: 'phly',
  password: 'phlyisthebest',
  port: '3306',
  database : 'phly'
});

var caseNumber = 10000;

connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    isDatabaseConnected = true;
    console.log("connected");
});


var server = http.createServer((req, res)=>{
    res.writeHead(200, {'Content-Type': 'text/plain'});

    var userInput = (req.url).split('?')[1];

    res.write("caseNumber: " + caseNumber.toString());
    res.end();

    // crawl date from now until the day searched
    crawl(caseNumber, userInput);
    caseNumber++;
}).listen(3000);

var crawl = function(caseNumber, input) {
    var sql = "CREATE TABLE `phly`.`" + caseNumber + "` ( \
      `flight_price` INT NOT NULL, \
      `flight_date` DATETIME NOT NULL, \
      `flight_from` VARCHAR(45) NOT NULL, \
      `flight_to` VARCHAR(45) NOT NULL, \
      `flight_time_now` DATETIME NOT NULL, \
      PRIMARY KEY (`flight_date`, `flight_time_now`))";

      // it's working but I don't want too many tables right now.

    connection.query(sql, function (err, result) {
        console.log("Table created");
    });

    var date = input.split('/')[1].split('-');
    console.log(date);
    var dates = getDates(new Date(2017,9,15), new Date(date[0],date[1] - 1,date[2]));
    dates.forEach(function(date) {
        var half = date.toISOString().split('T')[0];
        console.log(baseUrl + input.split('/')[0] + "/" + half + "/" + input.split('/')[2]);
        getData(baseUrl + input.split('/')[0] + "/" + half + "/" + input.split('/')[2], caseNumber, input.split('/')[0] + "/" + half + "/" + input.split('/')[2]);
    })

    var j = schedule.scheduleJob('30 * * * *', function(){
        var date = input.split('/')[1].split('-');
        console.log(date);
        var dates = getDates(new Date(2017,9,15), new Date(date[0],date[1] - 1,date[2]));
        dates.forEach(function(date) {
            var half = date.toISOString().split('T')[0];
            console.log(baseUrl + input.split('/')[0] + "/" + half + "/" + input.split('/')[2]);
            getData(baseUrl + input.split('/')[0] + "/" + half + "/" + input.split('/')[2], caseNumber, input.split('/')[0] + "/" + half + "/" + input.split('/')[2]);
        })
    });
}

// Returns an array of dates between the two dates
var getDates = function(startDate, endDate) {
    var dates = [], currentDate = startDate,
    addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    };
    while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addDays.call(currentDate, 1);
    }
    return dates;
};


var getData = function(url, caseNumber, input) {
    driver.get(url);

    driver.wait(webdriver.until.elementLocated(webdriver.By.id('searchResultsList')));

    driver.executeScript(_ => {
        return document.querySelector('#searchResultsList').innerHTML;
    })
    .then(innerHTML => {
        const $ = cheerio.load(innerHTML);
        dataToDatabase($, caseNumber, input);
    });
}

var dataToDatabase = function($, caseNumber, input) {
    var prices = [];
    $('.Base-Results-HorizonResult').each(function(i, elem) {
        prices[i] = $(this).attr('aria-label').split(' ')[3];
        console.log(prices[i]);
    });

    var min = Number.MAX_SAFE_INTEGER;
    for(var i = 0; i < prices.length; i++) {
        if(prices[i].split('')[0] === '$') {
                prices[i] = prices[i].substr(1);
                var curNum = prices[i] * 10 / 10
                if(min > curNum) min = curNum;
        }
    }

    var now = new Date().toISOString().split('.')[0].replace('T', ' ');
    var sql = "INSERT INTO `" + caseNumber + "` (flight_price, flight_date, flight_from, flight_to, flight_time_now) VALUES (" + min + ", '" + input.split('/')[1] + " 12:00:00'" + ", '" + input.split('/')[0].split('-')[0] + "', '" + input.split('/')[0].split('-')[1] + "', '" + now + "')";

    console.log(sql);
    connection.query(sql, function (err, result) {
        if (err) throw err;
    });
}
