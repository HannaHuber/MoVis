/**
 * Created by Hanna on 08.06.2017.
 */

/* Main method */
window.onload = function () {
    loadData(init);
};

function loadData(initMethod){
    console.log("Loading data...");
    d3.queue()
        .defer(d3.csv,"./data/ageDF_all.csv", parseRow)
        .defer(d3.csv,"./data/genderDF.csv", parseRow)
        .defer(d3.csv,"./data/originDF_all.csv", parseRow)
        .defer(d3.csv,"./data/movie_info.csv",parseInfo)
        .await(initMethod);
}

function parseAge(data, _, columns) {
    console.log("Parsing age data...");
    data.age = +data.age;
    for (var i = 1, t = 0, c; i < columns.length; ++i) {
        // start movie id at 0
        data[c = columns[i]] =  +data[c];
    }
    return data;
}

function parseRow(data, i, columns) {
    data.id = i; // convert from 1-based in file to 0-based
    for (var j = 0, s = 0, c; j < columns.length; ++j) {
        // start movie id at 0
        data[c = columns[j]] =  +data[c];
        s += data[c = columns[j]];
    }
    for (var j = 0, c; j < columns.length; ++j) {
        // start movie id at 0
        data[c = columns[j]] /=  s;
    }
    return data;
}

function parseInfo(data, i, columns) {
    console.log("Parsing meta data...");
    data.id = i;
    data.year = +data.year;
    data["title"] = data["title"];
    data["genres"] = data["genres"].split("|");
    return data;
}

function addInfoToBarData(data, info) {
    return data.map(function(d,id){
            d.title = info[id].title;
            d.year = info[id].year;
            d.genres = info[id].genres;
            return d;
    });
}

function getPDFFromCast(castRow, columns, yValue){
    return castRow.map(function(d){
        data = {};
        data.id = d.id;
        data.title = d.title;
        data.genres = d.genres;
        data.year = d.year;
        var values = [];
        columns.forEach(function(c,j) {
            tmp = {};
            tmp[yValue] = c;
            tmp.density = d[c];
            values[j] = tmp;
        });
        data.values = values;
        return data;
    });
}

function init(error, dataRowAge, dataRowGender, dataRowOrigin, info) {
    console.log("Processing data...");
    if (error) { console.log(error); }

    // Distributions for bar chart
    pdfRowAge = addInfoToBarData(dataRowAge, info);
    pdfRowGender = addInfoToBarData(dataRowGender, info);
    pdfRowOrigin = addInfoToBarData(dataRowOrigin, info);

    // Store labels
    columnsAge = dataRowAge.columns;
    columnsGender = dataRowGender.columns;
    columnsOrigin = dataRowOrigin.columns;

    // Distributions for line chart
    pdfAge = getPDFFromCast(pdfRowAge, columnsAge, "age");
    pdfGender = getPDFFromCast(pdfRowGender, columnsGender, "gender");
    pdfOrigin = getPDFFromCast(pdfRowOrigin, columnsOrigin, "origin");

    // Draw charts
    initBar();
    initLine();
}