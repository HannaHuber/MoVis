/**
 * Created by Hanna on 08.06.2017.
 */

var start = 305,
    end = 1000;//15365;
/* Main method */
window.onload = function () {
    loadData();
};

function loadData(){
    console.log("Loading data...");

    d3.selectAll('.spinningBar').classed('hidden', false);

    d3.queue()
        .defer(d3.csv,"./data/ageDF_all.csv", parseRow)
        .defer(d3.csv,"./data/genderDF.csv", parseRow)
        .defer(d3.csv,"./data/originDF_all.csv", parseRow)
        .defer(d3.csv,"./data/movie_info.csv",parseInfo)
        .await(init);
}

function loadGenderData(){
    d3.selectAll('.line-view').classed('hidden', false);
    d3.selectAll('.spinningLine').classed('hidden', false);

    console.log("Loading gender data...");
    d3.queue()
        .defer(d3.csv,"./data/ageDF_f.csv", parseRow)
        .defer(d3.csv,"./data/ageDF_m.csv", parseRow)
        .defer(d3.csv,"./data/originDF_f.csv", parseRow)
        .defer(d3.csv,"./data/originDF_m.csv", parseRow)
        .await(initGenderData);
}

function parseRow(data, i, columns) {
    console.log("Parsing cast data...");
    data.id = i; // convert from 1-based in file to 0-based
    for (var j = 0, s = 0, c; j < columns.length; ++j) {
        // start movie id at 0
        data[c = columns[j]] =  +data[c];
        s += data[c = columns[j]];
    }
    if (s>0){
        for (var j = 0, c; j < columns.length; ++j) {
            data[c = columns[j]] /=  s;
        }
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
    return data.map(function(d){
        var id = d.id;
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

function init(error, dataAge, dataGender, dataOrigin, info) {
    console.log("Processing data...");
    if (error) { console.log(error); }

    movieInfo = info;

    // Distributions for bar chart
    castAge = addInfoToBarData(dataAge.slice(start,end), info);
    castGender = addInfoToBarData(dataGender.slice(start,end), info);
    castOrigin = addInfoToBarData(dataOrigin.slice(start,end), info);

    // Store labels
    columnsAge = dataAge.columns;
    columnsGender = dataGender.columns;
    columnsOrigin = dataOrigin.columns;

    /*// Distributions for line chart
    pdfAge = getPDFFromCast(castAge, columnsAge, "age");
    pdfGender = getPDFFromCast(castGender, columnsGender, "gender");
    pdfOrigin = getPDFFromCast(castOrigin, columnsOrigin, "origin");

    // Distributions for female/male cast
    pdfAgeF = addInfoToBarData(dataAgeF, info);
    pdfAgeM = addInfoToBarData(dataAgeM, info);
    //pdfOriginF = addInfoToBarData(dataOriginF, info);
    //pdfOriginM = addInfoToBarData(dataOriginM, info);
    pdfAgeF = getPDFFromCast(pdfAgeF, columnsAge, "age");
    pdfAgeM = getPDFFromCast(pdfAgeM, columnsAge, "age");
    //pdfOriginF = getPDFFromCast(pdfOriginF, columnsOrigin, "origin");
    //pdfOriginM = getPDFFromCast(pdfOriginM, columnsOrigin, "origin");*/

    // Draw charts
    initBar();
    //initLine();

    //loadGenderData();
}

function update() {
    updateBar();
    if (isLoadedGenderData){
        updateLine();
    }
}

function toggleLineView(){
    if (d3.selectAll('.line-view').classed('hidden')){
        d3.selectAll('.line-view').classed('hidden', false);
        if (isLoadedGenderData){
            updateLine();
        } else {
            loadGenderData();
        }
    } else {
        d3.selectAll('.line-view').classed('hidden', true);
    }
}

function initGenderData(error,dataAgeF,dataAgeM, dataOriginF, dataOriginM) {//, dataOriginF, dataOriginM
    console.log("Processing gender data...");
    if (error) { console.log(error); }

    // Distributions for line chart
    pdfAge = getPDFFromCast(castAge, columnsAge, "age");
    pdfGender = getPDFFromCast(castGender, columnsGender, "gender");
    pdfOrigin = getPDFFromCast(castOrigin, columnsOrigin, "origin");

    // Distributions for female/male cast
    //pdfAgeF = addInfoToBarData(dataAgeF, movieInfo);
    //pdfAgeM = addInfoToBarData(dataAgeM, movieInfo);
    //pdfOriginF = addInfoToBarData(dataOriginF, info);
    //pdfOriginM = addInfoToBarData(dataOriginM, info);
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

    initLine();

    isLoadedGenderData = true;
}
