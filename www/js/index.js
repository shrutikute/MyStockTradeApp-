/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var appDb = {
    initialize: function () {
        this.db = null;
        this.bindEvents();
    },
    openDatabase: function () {
        var dbSize = 5 * 1024 * 1024; // 5MB
        // open database
        appDb.db = openDatabase("portfolio", "", "My stock trade database", dbSize, function () {
            console.log('db successfully opened or created');
        });
    },
    createUserTable: function () {
        appDb.db.transaction(function (tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS account(ID INTEGER PRIMARY KEY ASC, usrName TEXT, usrPass TEXT)", [],
                appDb.onSuccess, appDb.onError);
        });
    },
    createStocksTable: function () {
        appDb.db.transaction(function (tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS stocks(ID INTEGER PRIMARY KEY ASC, usrId INTEGER, name TEXT, price TEXT)", [],
                appDb.onSuccess, appDb.onError);
        });
    },
    addStock: function (usrId, name, price) {
        appDb.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO stocks(usrId,name, price) VALUES (?,?,?)", [usrId, name, price], appDb.onSuccess, appDb.onError);
        });
    },
    removeStock: function (usrId, name) {
        appDb.db.transaction(function (tx) {
            tx.executeSql("DELETE FROM stocks WHERE name=? AND usrId=?", [name,usrId], appDb.onSuccess, appDb.onError);
        });
    },
    addUser: function (name, pass) {
        appDb.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO account(usrName, usrPass) VALUES (?,?)", [ name, pass], stocksApp.signUpSuccess, appDb.onError);
        });
    },
    authUser: function (usrName, usrPass) {
        appDb.db.transaction(function (tx) {
            tx.executeSql("SELECT * FROM account WHERE usrName=? AND usrPass=?", [usrName, usrPass], stocksApp.authSuccess, appDb.onError);
        });
    },
    getStocks: function (usrId) {
        console.log(usrId,"wewfew");
        appDb.db.transaction(function (tx) {
            tx.executeSql("SELECT * FROM stocks WHERE usrId=?", [usrId], stocksApp.displayMyStocks, appDb.onError);
        });
    },
    onSuccess: function() {

    },
    onError: function(e) {
        console.log(e);

    }
};

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);

        stocksApp.init();
    }
};

$(document).bind("pagebeforechange", function (event, data) {
    $.mobile.pageData = (data && data.options && data.options.pageData)
        ? data.options.pageData
        : null;
});

var stocksApp = {
    init: function () {

        var that = this;
        this.stocksEntries = [];
        var deferred = $.Deferred();

        appDb.openDatabase();
        appDb.createStocksTable();
        appDb.createUserTable();
   //change the localhost to your machince IP to make it run in android emulator
        $.get('http://192.168.0.5:5000/stocks', function (data) {
            that.stocksEntries = data;
            deferred.resolve(that.stocksEntries);

        });

        $(".logout-menu-btn").on('click', function() {
            $(".logout-menu-btn").hide();
            $(".login-menu-btn").show();
        });


        $(document).on("pageshow", "#intropage", function (e) {
            deferred.done(function (stocks) {
                that.displayStocks(stocks);

                $('.count-buy').on('click', function() {
                    var symbol = $(this).data('symbol');
                    var price = $(this).data('price');
                    console.log(symbol,price)
                    appDb.addStock(app.currentUserId,symbol,price)

                });
            });
        });

        $(document).on("pageshow", "#myStocksContent", function (e) {
            console.log("dededeed")
            appDb.getStocks(app.currentUserId);
            });

        $(document).on("pageshow", "#stockpage", function (e) {
            var stock = $.mobile.pageData.id;
            $("h1", this).text(stock);
         //change the localhost to your machince IP to make it run in android emulator
            $.get('http://192.168.0.5:5000/stocks/' + stock, function (data) {
                that.displayStockDetails(data);
            });
        });

        $(document).on("pageshow", "#signupPage", function (e) {
            $("#usr-signup-form").on('submit', function (e) {
                var usrName = $(this).find("input#usr-name").val();
                var usrPass = $(this).find("input#usr-pass").val();
                appDb.addUser(usrName,usrPass);
                $.mobile.changePage("index.html");
            });
        });

        $(document).on("pageshow", "#loginPage", function (e) {
            $("#usr-login-form").on('submit', function (e) {
                var usrName = $(this).find("input#usr-name").val();
                var usrPass = $(this).find("input#usr-pass").val();
                appDb.authUser(usrName,usrPass);
            });
        });
    },

    authSuccess: function(tx,rs) {
        if(rs.rows.length > 0) {
            $.mobile.changePage("#intropage");
            app.currentUserId = rs.rows.item(0).ID;
            $(".login-menu-btn").hide();
            $(".logout-menu-btn").show();
        }
    },
    signUpSuccess: function(tx,rs) {
        if(rs.rowsAffected > 0) {
            $.mobile.changePage("#loginPage");
        }
    },
    displayStockDetails: function (stock) {
        var stock = JSON.parse(stock);
        var s = "";
        for (var item in stock) {
            s += '<tr><td>' + item + '</td><td>' + stock[item] + '</td></tr>'
        }
        $(".stock-table-body").append(s);
    },
    displayStocks: function (stocks) {
        var stocks = JSON.parse(stocks);
        var s = "";
        for (var i = 0; i < stocks.length; i++) {
            var stock = stocks[i];
            s += '<li><a href="#stockpage?id=' + stock.symbol + '">' + stock.symbol + ' <span class="ui-li-count count-price">$' + stock.open + '</span></a><span data-symbol="'+stock.symbol+'" data-price="'+stock.open+'" class="ui-li-count count-buy">BUY</span></li>';
        }
        $("#stocksList").html(s);
        $("#stocksList").listview("refresh");
    },
    displayMyStocks: function(tx,rs) {
        var stocks = rs.rows;
        console.log(stocks,"my stocks");
        var s = "";
        for (var i = 0; i < stocks.length; i++) {
            var stock = stocks.item(i);
            s += '<li><a href="#stockpage?id=' + stock.name + '">' + stock.name + ' <span class="ui-li-count count-price">$' + stock.price + '</span></a><span data-symbol="'+stock.name+'" data-price="'+stock.price+'" class="ui-li-count count-sell">Sell</span></li>';
        }
        $("#mystocksList").html(s);

        $('.count-sell').on('click', function() {
            var symbol = $(this).data('symbol');
            var price = $(this).data('price');
            console.log(symbol,price)
            appDb.removeStock(app.currentUserId,symbol,price);
            $(this).parent().remove();
        });

        $("#mystocksList").listview("refresh");

    }

};

