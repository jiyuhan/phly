var mysql = require('mysql');
var http = require('http');
var brain = require('brain');
var net = new brain.NeuralNetwork();

var connection = mysql.createConnection({
  host: 'phly.c7jx0v6pormd.us-east-1.rds.amazonaws.com',
  user: 'phly',
  password: 'phlyisthebest',
  port: '3306',
  database : 'phly'
});

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

    if(userInput.split('&')[1]) userInput = userInput.split('&')[0];

    // crawl date from now until the day searched
    analyzeData(userInput, function(err, data) {
        var finalResult = mldata(data);
        res.write("result({\"date\":\"" + finalResult + "\",\"confidence\":" + 0 + "})");
        // res.write("result({\"date\":\"Sat Oct 14 2017 16:12:57 GMT-0500 (CDT)\",\"confidence\":0})");
        res.end();
    });
}).listen(4000);

var analyzeData = function (caseNumber, callback) {
    //TODO: implement the algorithm

    var sql = "SELECT * FROM `" + caseNumber + "`"
    connection.query(sql, function (err, result) {
        if (err)  callback(err, null);

        else callback(null, result);
    });
}

var mldata = function(data) {
    var traindata = [];
    data.forEach(function(datum) {
        var now = new Date(datum.flight_time_now);
        var date = new Date(datum.flight_date);
        var piece = {"input": [now.getTime(), date.getTime()], "output": [datum.flight_price]};
        traindata.push(piece);
    });

    net.train(traindata
        , {
        errorThresh: 0.5,  // error threshold to reach
        iterations: 10000,   // maximum training iterations
        log: true,           // console.log() progress periodically
        logPeriod: 10,       // number of iterations between logging
        learningRate: 0.5    // learning rate
        }
    );
    var output = [];
    var input = [];
    for(var i = 0; i < data.length; i++) {
        output[i] = net.run(data[i].flight_time_now); // [precipitation, river water depth]
        input[i] = data[i].flight_time_now;
    }

    var min = Number.MAX_SAFE_INTEGER;
    var minI = 0;
    for(var i = 0; i < output.length; i++) {
        if(output[i] < min) {
            min = output[i];
            minI = i;
        }
    }

    console.log(input[minI]);
    return input[minI];
}
