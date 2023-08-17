require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'patnUDbAMMqIfvbis.c3030f7410f153962d22ea3a3e34a93555506a2558610b2c19717ee49c9eb580'
    // this api key should not be mentioned like this in code and should be inserted using environment variables, only for the purpose of this test I have included it here
});
var base = Airtable.base('appX8f2HBzKSDS3fw');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

function coinDetailsUpdate() {
    fetch('https://api.coingecko.com/api/v3/coins/list')
        .then(res => res.json())
        .then(json => {
            for (var i = 0; i < 20; i++) {
                console.log(json[i]);
                base('Coins').create([
                  {
                    "fields": {
                      "id": json[i].id,
                      "symbols": json[i].symbol,
                      "Name": json[i].name
                    }
                  }
                ], function(err, records) {
                  if (err) {
                    console.error(err);
                    return;
                  }
                });
            }
    })
}

function currentCoinPriceUpdate() {
      var coinsids = ""
      var coinsname = []
      var recordids = []
      base('Coins').select({
            // Selecting the first 20 records in Grid view:
            maxRecords: 20,
            view: "Grid view"
      }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.
            for(var i = 0 ; i < records.length-1 ; i++){
               coinsids += records[i].get('id') + ',';
               
               recordids.push(records[i].getId())
               coinsname.push(records[i].get('name'));
               // console.log(records[i].getId())
            }
            coinsids += records[records.length-1].get('id');
            // records.forEach(function(record) {
            //    coinids += record.get('id'));
            // });

            console.log(coinsids);
            console.log(recordids.join(','));
      
            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.
            fetchNextPage();
      
      }, function done(err) {
            if (err) { console.error(err); return; }
      });

      fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + coinsids + '&vs_currencies=usd&include_market_cap=true') // needs to be updated with list of coin ids
            .then(res => res.json())
            .then(json => {
               var newDetails = []
               for (var i = 0; i < recordids.length; i++) {
                  newDetails += {"id": recordids[i],
               "fields": {
                  "Price": json.coinsname[i].usd,
                  "market cap" : json.coinsname[i].usd_market_cap
               }}
               }
               base('Coins').update(
                  newDetails, function(err, records) {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  records.forEach(function(record) {
                    console.log(record.get('Name'));
                  });
                });
            })
   }

var updateInterval = setInterval(coinDetailsUpdate, 600000);
var currentUpdateInterval = setInterval(currentCoinPriceUpdate, 60000);


