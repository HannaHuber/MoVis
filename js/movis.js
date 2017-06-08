/**
 * Created by Hanna on 03.06.2017.
 */

// 1-based movie ids
var startID = 306, // beginning of A
    endID = 6834; // end of C

var selectedYear = 1950; //document.getElementById("dropdownYear").value;
var selectedGenre = document.getElementById("dropdownGenre").value;
var selectedGender = document.getElementById("dropdownGender").value;
var isAverage = document.getElementById("checkboxAverage").checked;

var svgLine = d3.select("#svgLine"),
    margin = { top: 20, right: 80, bottom: 30, left: 50 },
    width = svgLine.attr("width") - margin.left - margin.right,
    height = svgLine.attr("height") - margin.top - margin.bottom,
    g = svgLine.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return x(d.age); })
    .y(function (d) { return y(d.density); });

var movie,
    movieLine;
	//movieLabel;
var pdf;
loadData(init);



function updateFilter(){
    selectedYear = document.getElementById("dropdownYear").value;
    selectedGenre = document.getElementById("dropdownGenre").value;
    selectedGender = document.getElementById("dropdownGender").value;
    isAverage = document.getElementById("checkboxAverage").checked;
    console.log(selectedYear);
    //movieLabel.remove();
    //movieLine.remove();
    //loadData(parseAge,update);
    update();
}

function parseAge(data, _, columns) {
    data.age = +data.age;
    for (var i = 1, t = 0, c; i < columns.length; ++i) {
        // start movie id at 0
        data[c = columns[i]] =  +data[c];
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

function init(error, data, info) {
    if (error) { console.log(error); }
    console.log(data[0]);
    console.log(info[0]);

    pdf = data.columns.slice(startID,endID +1).map(function (id) {
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

    var dropdown = document.getElementById("dropdownYear");
    var years = d3.nest()
        .key(function (d){return d.year;})
        .entries(info)
        .map(function (d){return d.key;}).sort();
    years.forEach(function(d){
        var option = document.createElement("option");
        option.text = "" + d + "";
        dropdown.add(option);
    });
    var combinedGenres = d3.nest()
        .key(function (d){return d.genres;})
        .entries(info).map(function(d){return d.key;});
    genres = [];
    combinedGenres.forEach(function(d){
        genres = genres.concat(d.split(","));
    });
    genres = d3.nest().key(function(d){return d}).entries(genres).sort(function(x,y){return d3.ascending(x.key,y.key)});
    dropdown = document.getElementById("dropdownGenre");
    genres.forEach(function(d){
        option = document.createElement("option");
        option.text = d.key;
        dropdown.add(option);
    });

    x.domain(
        d3.extent(data, function (d) { return d.age; })
    );
    y.domain([
        d3.min(pdf, function (c) { return d3.min(c.values, function (d) { return d.density; }); }),
        d3.max(pdf, function (c) { return d3.max(c.values, function (d) { return d.density; }); })
    ]);

    // Axes
    svgLine.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("transform",
            "translate(" + (width/2) + " ," +
            (height + margin.top ) + ")")
        .style("text-anchor", "middle")
        .text("Age");
    svgLine.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Density");


    // movie lines
    var selection = getSelection();
    var movie = svgLine.selectAll(".movie")
        .data(selection);
    //movie
       // .enter().append("g")
        //.attr("class", "movie");

    movieLine =
        movie.enter()
        .append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); });

        movieLine.on("mouseout", function(){
            d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
        })
        movieLine.on("mouseover", function(){
            d3.select(this)
                .style({"stroke-opacity":"1","stroke-width":"1px"});
        });

    //movieLabel =
    movie.enter()
        .append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + x(d.value.age) + "," + y(d.value.density) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) {
            return "id:" + d.id + ", title:" + d["title"];
        });

}

function getSelection() {
    console.log(selectedYear);
    console.log(selectedGenre);

    var selection = pdf;
    // filter
    if (selectedYear != "all") {
        selection = selection.filter(function (c) {
            return c.year == selectedYear
        })
    }

    if (selectedGenre != "all") {
        selection = selection.filter(function (c) {
            return c.genres.includes(selectedGenre);
        })
    }

    // average
    if (isAverage) {
        selection =  selection.map(function (c) {
            var meanDensities = [];
            for (var k = 0; k < c.values.length; ++k) {
                meanDensities[k] = d3.mean(selection.map(function (c) {
                    return c.values;}).map(function(d,i){return d[k];}), function(d){return d.density;});
            }
            var tmp = c.values.map(function(d,i) {
                return {
                    age:d.age,
                    density: meanDensities[i]
                };
            });
            return {
                id:"-",
                title:"-",
                year:selectedYear,
                genres:selectedGenre,
                values: tmp
                };
        });
    }
    selection.forEach(function(d){console.log(d.id);});
    return selection;
}

function update(error, data) {
    var selection = getSelection();

    movieLine.remove();

    //svgLine.selectAll(".movie").remove();
    //g.selectAll(".movie").remove();

    var movie = svgLine.selectAll(".movie")
        .data(selection);

    movie.exit().remove();
    //movie
     //   .enter()//.append("g")
        //.attr("class", "movie");


    movieLine = movie.enter()//
        .append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .on("mouseout", function(){
            d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
        })
        .on("mouseover", function(){
            d3.select(this)
                .style({"stroke-opacity":"1","stroke-width":"1px"});
        });

    //movieLabel =
    movie.enter()
        .append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + x(d.value.age) + "," + y(d.value.density) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) {
            return "id:" + d.id + ", title:" + d["title"];
        });
    //g.removedNodes();

    /*
    console.log(selectedYear);
    var pdf = data.columns.slice(1,100).map(function (id) {
        return {
            id: id,
            values: data.map(function (d) {
                return { age: d.age, density: d[id]/d3.sum(data,function(d){return d[id]}) };
            })
        };
    });
    x.domain(d3.extent(data, function (d) { return d.age; }));
    y.domain([
        d3.min(pdf, function (c) { return d3.min(c.values, function (d) { return d.density; }); }),
        d3.max(pdf, function (c) { return d3.max(c.values, function (d) { return d.density; }); })
    ]);
    // Select the section we want to apply our changes to
    var svg = d3.select("svgLine").transition();

    // Make the changes
    svg.select(".line")   // change the line
        .duration(750)
        .attr("d", function (d) { return line(d.values); });
    svg.select(".x.axis") // change the x axis
        .duration(750)
        .call(d3.svg.axis().scale(x).orient("bottom"));
    svg.select(".y.axis") // change the y axis
        .duration(750)
        .call(d3.svg.axis().scale(y).orient("left"));*/

}

/*function updateFilter(){
    selectedYear = document.getElementById("dropId").value;
	console.log(selectedYear);
    loadData(parseAge,init);
}*/

function loadData(f2){
    /*d3.request("./data/age_all_id_1-15k.csv")
        .mimeType("text/plain")
        .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText, f1)})
        .get(f2);*/

//d3.request("./raw/movie_meta.csv")
//   .mimeType("text/plain")
//   .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText, parseInfo

    d3.queue()
        .defer(d3.csv,"./data/age_all_id_1-15k_cs.csv", parseAge)
         .defer(d3.csv,"./data/movie_info.csv",parseInfo)
     // /*  .defer(readDSV, "./data/pdf/age_all_id_1-15k.csv", parseAge)
//.defer(readDSV, "./data/meta/movie_meta.csv", parseInfo)
//.awaitAll(draw);




//   .defer(d3.csv,"./data/age_all_id_1-15k_cs_unknown15137.csv", f1)
//.defer(d3.csv,"./data.csv", type)
//.defer(d3.csv,"./data/pdf/originDF_all.csv")
//.defer(d3.csv, "./data/pdf/originDF_m.csv")
//.defer(d3.csv, "./data/pdf/originDF_f.csv")

//.defer(d3.csv,"./data/pdf/ageDF_m.csv")
//.defer(d3.csv,"./data/pdf/ageDF_f.csv")
//.defer(d3.csv,"./data/pdf/genderDF.csv")*/
.await(f2);
}

function readDSV(file, access) {
    d3.request(file)
    //.mimeType("text/plain")
        .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText,access )})
        .get(draw);
}

/* BAR CHART */

