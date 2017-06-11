/**
 * Created by Hanna on 08.06.2017.
 */

/* Main method */
window.onload = function () {
    loadData(init);
}

function loadData(initMethod){
    d3.queue()
        .defer(d3.csv,"./data/age_all_id_1-15k_row.csv", parseAgeRow)
        .defer(d3.csv,"./data/age_all_id_1-15k_cs.csv", parseAge)
        .defer(d3.csv,"./data/movie_info.csv",parseInfo)
        .await(initMethod);
}

function parseAge(data, _, columns) {
    data.age = +data.age;
    for (var i = 1, t = 0, c; i < columns.length; ++i) {
        // start movie id at 0
        data[c = columns[i]] =  +data[c];
    }
    return data;
}

function parseAgeRow(data, i, columns) {
    data.id = +data.id -1; // convert from 1-based in file to 0-based
    for (var i = 1, s = 0, c; i < columns.length; ++i) {
        // start movie id at 0
        data[c = columns[i]] =  +data[c];
        s += data[c = columns[i]];
    }
    for (var i = 1, c; i < columns.length; ++i) {
        // start movie id at 0
        data[c = columns[i]] /=  s;
    }
    return data;
}

function parseInfo(data, i, columns) {
    data.id = i;
    data.year = +data.year;
    data["title"] = data["title"];
    data["genres"] = data["genres"].split("|");

    return data;
}

function init(error, dataRow, data, info) {
    if (error) { console.log(error); }

    pdf = data.columns.slice(1).map(function (id) {
        return {
            id: id-1,
            title: info[id-1].title,
            year: info[id-1].year,
            genres: info[id-1].genres,
            values: data.map(function (d) {
                return { age: d.age, density: d[id]/d3.sum(data,function(d){return d[id]}) };
            })
        };
    });

    pdfRow = dataRow.map(function(d,id){
        d.title = info[id].title;
        d.year = info[id].year;
        d.genres = info[id].genres;
        return d;
    });

    // draw
    initBar(dataRow.columns);
    //initLine();
}