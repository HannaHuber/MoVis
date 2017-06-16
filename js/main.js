/**
 * Created by Hanna on 08.06.2017.
 */

// Increase performance by loading only a part of the dataset
var start = 305, // A
    end = 15365; // K

/* Main method */
window.onload = function () {
    loadData();
};
/*
* Loads cast data from csv files
*/
function loadData(){
    // Start loader animation
    d3.selectAll('.spinningBar').classed('hidden', false);
    console.log("Loading data...");

    // Load age, gender, origin and info files and process together
    d3.queue()
        .defer(d3.csv,"./data/ageDF_all.csv", parseAttribute)
        .defer(d3.csv,"./data/genderDF.csv", parseAttribute)
        .defer(d3.csv,"./data/originDF_all.csv", parseAttribute)
        .defer(d3.csv,"./data/movie_info.csv",parseInfo)
        .await(prepareBar);
}
/*
* Loads additional gender-specific data used by line chart
 */
function loadGenderData(){
    // Start loader animation
    d3.selectAll('.spinningLine').classed('hidden', false);
    console.log("Loading gender data...");

    // Load gender-specific and origin files and process together
    d3.queue()
        .defer(d3.csv,"./data/ageDF_f.csv", parseAttribute)
        .defer(d3.csv,"./data/ageDF_m.csv", parseAttribute)
        .defer(d3.csv,"./data/originDF_f.csv", parseAttribute)
        .defer(d3.csv,"./data/originDF_m.csv", parseAttribute)
        .await(prepareLine);
}
/*
* Parses ith row of a cast attribute csv file
* Calculates normalized density, e.g.
*           Female, Male, Unknown
* csv:      4,      10,   2
* parsed:   0.25, 0.635, 0.125
*/
function parseAttribute(data, i, columns) {

    // Store movie id
    data.id = i;

    // Iterate over cast and store density values
    for (var j = 0, s = 0, c; j < columns.length; ++j) {
        data[c = columns[j]] =  +data[c];
        s += data[c = columns[j]];
    }
    // Normalize density values
    if (s>0){
        for (var j = 0, c; j < columns.length; ++j) {
            data[c = columns[j]] /=  s;
        }
    }
    return data;
}

/*
 * Parses ith row of the info csv file, e.g.
 *          Year, Title, Genres
 * csv:     1988,A Fish Called Wanda,Comedy|Crime
 * parsed:  1988,"A Fish Called Wanda",["Comedy","Crime"]
 */
function parseInfo(data, i, columns) {
    data.id = i;
    data.year = +data.year;
    data["title"] = data["title"];
    data["genres"] = data["genres"].split("|");
    return data;
}

/*
* Adds parsed info to parsed attribute  data
 */
function addInfoToBarData(data, info) {
    return data.map(function(d){
        var id = d.id;
        d.title = info[id].title;
        d.year = info[id].year;
        d.genres = info[id].genres;
        return d;
    });
}
/*
* Restructures cast data as a probability distribution function (pdf)
* to be used by line chart
 */
function getPDFFromCast(castRow, columns, yValue){
    return castRow.map(function(d){
        // Create new object
        data = {};

        // Store movie info
        data.id = d.id;
        data.title = d.title;
        data.genres = d.genres;
        data.year = d.year;

        // Create pdf for attribute yValue
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

/*
* Callback for loaded attribute files
* Combines and processes age, gender and origin data and movie info
 */
function prepareBar(error, dataAge, dataGender, dataOrigin, info) {
    if (error) { console.log(error); }

    console.log("Processing data...");

    // Store for later use by prepareLine()
    movieInfo = info;

    // Distributions for bar chart
    castAge = addInfoToBarData(dataAge.slice(start,end), info);
    castGender = addInfoToBarData(dataGender.slice(start,end), info);
    castOrigin = addInfoToBarData(dataOrigin.slice(start,end), info);

    // Store labels
    columnsAge = dataAge.columns;
    columnsGender = dataGender.columns;
    columnsOrigin = dataOrigin.columns;

    // Draw bar chart
    initBar();
}
/*
* Callback for bar chart y-axis change
 */
function update() {
    // Update bar chart
    updateBar();

    // Update line chart only if it has been initialized
    if (isInitLine){
        updateLine();
    }
}

/*
* Shows/hides the line chart and its description
 */
function toggleLineView(){
    // If line view is inactive
    if (d3.selectAll('.line-view').classed('hidden')){
        // Show line view
        d3.selectAll('.line-view').classed('hidden', false);
        if (isInitLine){
            // Update line chart
            updateLine();
        } else {
            // Init line chart
            loadGenderData();
        }
    } else {
        d3.selectAll('.line-view').classed('hidden', true);
    }
}
/*
* Callback for loaded gender data
* Prepares cast data for use by line chart
* Combines and processes gender-specific age and origin data and movie info
*/
function prepareLine(error, dataAgeF, dataAgeM, dataOriginF, dataOriginM) {//, dataOriginF, dataOriginM
    if (error) { console.log(error); }

    console.log("Processing gender-specific data...");

    // Distributions for line chart
    pdfAge = getPDFFromCast(castAge, columnsAge, "age");
    pdfGender = getPDFFromCast(castGender, columnsGender, "gender");
    pdfOrigin = getPDFFromCast(castOrigin, columnsOrigin, "origin");

    // Distributions for female/male cast
    pdfAgeF = getPDFFromCast(
        addInfoToBarData(dataAgeF.slice(start,end), movieInfo),
        columnsAge, "age");
    pdfAgeM = getPDFFromCast(
        addInfoToBarData(dataAgeM.slice(start,end), movieInfo),
        columnsAge, "age");
    pdfOriginF = getPDFFromCast(
        addInfoToBarData(dataOriginF.slice(start,end), movieInfo),
        columnsOrigin, "origin");
    pdfOriginM = getPDFFromCast(
        addInfoToBarData(dataOriginM.slice(start,end), movieInfo),
        columnsOrigin, "origin");

    // Draw line chart
    initLine();

    // Update chart status
    isInitLine = true;
}
