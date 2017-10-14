var http = require('http');
var mysql = require('mysql');
var https = require('https');
var htmlparser = require("htmlparser2");
const webdriver = require('selenium-webdriver');
var cheerio = require('cheerio');

let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

// sample url: https://www.kayak.com/flights/COU-SFO/2017-10-16/2017-10-19
var baseUrl = 'https://www.kayak.com/flights/';
var testUrl = 'COU-SFO/2017-10-16/2017-10-19';

var connection = mysql.createConnection({
  host: 'phlydata.c7jx0v6pormd.us-east-1.rds.amazonaws.com',
  user: 'thomas',
  password: 'phlyisgreat',
  port: '3310',
  database : 'phlydata'
});

var isDbConnected = false;
var isServerCreated = false;
var userInput = '';
var caseNumber = 0;

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

    userInput = (req.url).split('?')[1];

    res.write("caseNumber:" + caseNumber.toString());
    res.end();

    crawl(caseNumber, userInput);
    caseNumber++;
}).listen(3000);

var crawl = function(caseNumber, input) {
    var sql = "CREATE TABLE `phlydata`.`" + caseNumber + "` ( \
      `flight_price` INT NULL, \
      `flight_date` DATETIME NOT NULL, \
      `flight_from` VARCHAR(45) NULL, \
      `flight_to` VARCHAR(45) NULL, \
      `flight_airline` VARCHAR(45) NOT NULL, \
      `flight_date_distance` INT NULL, \
      PRIMARY KEY (`flight_date`, `flight_airline`))";

      // it's working but I don't want too many tables right now.

    // connection.query(sql, function (err, result) {
    //     if (err) throw err;
    //     console.log("Table created");
    // });

    var url = baseUrl + input;

    driver.get(url);

    driver.wait(webdriver.until.elementLocated(webdriver.By.id('searchResultsList'))).then(_ => { console.log("loaded.") });

    driver.executeScript(_ => {
        return document.querySelector('#searchResultsList').innerHTML;
    })
    .then(innerHTML => {
        const $ = cheerio.load(innerHTML);
        dataToDatabase($, caseNumber, input);
    });

    // driver.quit();
}

// var parseHtmlToJson = function(data, caseNumber, input) {
//     //TODO: parse html to DOM
//
//     var handler = new htmlparser.DomHandler(function (error, dom) {
//             dataToDatabase(dom, caseNumber, input);
//     });
//     var parser = new htmlparser.Parser(handler);
//     parser.write(data);
//     parser.done();
// }

//.replace(/(\r\n|\n|\r)/gm,"")
var dataToDatabase = function($, caseNumber, input) {
    $('.Base-Results-HorizonResult').each(function(i, elem) {
        console.log($(this).attr('aria-label'));
    });

    //console.log(dom[15].prev.children[4].next.children[1].children[1].children[9].children[1].children[1].children[5].children[1].children[3].children[1].children);

    // var filtered = dom[1].children.filter(data => {
    //     // return Object.hasOwnProperty.call(data, 'type');
    //     // return data.attribs.class === 'Flights-Results-BestFlights';
    //     // return
    // });

    // filtered = [];
    // for(var i = 1; i < dom[1].children.length; i = i + 2) {
    //     filtered.push(dom[1].children[i]);
    // }
    //
    // var filterMore = filtered.filter(data => {
    //     return (data.attribs.class === 'Flights-Results-BestFlights' || data.attribs.class === 'Base-Results-HorizonResult Flights-Results-FlightResultItem ');
    // });
    // // best
    // var totalDataQueried = [];
    // var airline = filterMore[0].children[1].children[5].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[0].data;
    // var time = filterMore[0].children[1].children[5].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[1].children[0].data;
    // var price = filterMore[0].children[1].children[5].children[3].children[1].children[3].children[1].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[0].data;
    // totalDataQueried.push({'airline': airline,
    //         'date': input.split('/')[1],
    //         'time': time,
    //         'from': input.split('/')[0].split('-')[0],
    //         'to': input.split('/')[0].split('-')[1],
    //         'price': price.split('$')[1],
    //         'caseNumber': caseNumber
    //     });
    // airline = filterMore[0].children[1].children[7].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[0].data;
    // time = filterMore[0].children[1].children[7].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[1].children[0].data;
    // price = filterMore[0].children[1].children[7].children[3].children[1].children[3].children[1].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[0].data;
    // totalDataQueried.push({'airline': airline,
    //         'date': input.split('/')[1],
    //         'time': time,
    //         'from': input.split('/')[0].split('-')[0],
    //         'to': input.split('/')[0].split('-')[1],
    //         'price': price.split('$')[1],
    //         'caseNumber': caseNumber
    //     });
    // // other
    //
    // for(var i = 1; i < filterMore.length; i = i + 2) {
    //     airline = filterMore[i].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[0].data;
    //     time = filterMore[i].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[1].children[3].children[1].children[0].data;
    //     price = filterMore[i].children[3].children[1].children[3].children[1].children[3].children[1].children[1].children[1].children[1].children[1].children[1].children[0].data;
    //     totalDataQueried.push({'airline': airline,
    //             'date': input.split('/')[1],
    //             'time': time,
    //             'from': input.split('/')[0].split('-')[0],
    //             'to': input.split('/')[0].split('-')[1],
    //             'price': price.split('$')[1],
    //             'caseNumber': caseNumber
    //         });
    // }

    // console.log(totalDataQueried);
}

// var insert = function(carrier, date, time, from, to, price, caseNumber) {
//     var sql = "INSERT INTO " + caseNumber + " (flight_price, flight_date, flight_from, flight_to, flight_airline, flight_date_distance) VALUES ?";
//
//     var sql = "INSERT INTO temps (temp_datetime, temp_c_val, temp_series_name) VALUES ?";
//
//     // something need to change here.
//     var values = [
//         [price, date + time, from, to, carrier, new Date().toISOString().replace(/T/, ' ').replace(/\..+/)]
//     ];
//     connection.query(sql, [values], function (err, result) {
//       if (err) throw err;
//     });
// }
