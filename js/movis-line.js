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
    marginLine = { top: 10, right: 50, bottom: 10, left: 50 },
    widthLine = svgLine.attr("widthLine") - marginLine.left - marginLine.right,
    heightLine = svgLine.attr("heightLine") - marginLine.top - marginLine.bottom,
    gLine = svgLine.append("gLine").attr("transform", "translate(" + marginLine.left + "," + marginLine.top + ")");

var xLine = d3.scaleLinear().range([0, widthLine]),
    yLine = d3.scaleLinear().range([heightLine, 0]);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return xLine(d.age); })
    .y(function (d) { return yLine(d.density); });

var movieLine,
	movieLabel;

function updateFilter(){
    selectedYear = 1950; //document.getElementById("dropdownYear").value;
    selectedGenre = document.getElementById("dropdownGenre").value;
    selectedGender = document.getElementById("dropdownGender").value;
    isAverage = document.getElementById("checkboxAverage").checked;
    console.log(selectedYear);
    updateLine();
}

function initLine() {

    var dropdown = document.getElementById("dropdownYear");
    var years = d3.nest()
        .key(function (d){return d.year;})
        .entries(pdf)
        .map(function (d){return d.key;}).sort();
    years.forEach(function(d){
        var option = document.createElement("option");
        option.text = "" + d + "";
        dropdown.add(option);
    });
    var combinedGenres = d3.nest()
        .key(function (d){return d.genres;})
        .entries(pdf).map(function(d){return d.key;});
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

    xLine.domain(
        d3.extent(pdf.map(function (c){return c.values.map(function (d){return d.age})})[0])
    );
    yLine.domain([
        d3.min(pdf, function (c) { return d3.min(c.values, function (d) { return d.density; }); }),
        d3.max(pdf, function (c) { return d3.max(c.values, function (d) { return d.density; }); })
    ]);

    // Axes
    svgLine.append("gLine")
        .attr("class", "axis axis--xLine")
        .attr("transform", "translate(0," + heightLine + ")")
        .call(d3.axisBottom(xLine))
        .append("text")
        .attr("transform",
            "translate(" + (widthLine/2) + " ," +
            (heightLine + marginLine.top ) + ")")
        .style("text-anchor", "middle")
        .text("Age");
    svgLine.append("gLine")
        .attr("class", "axis axis--yLine")
        .call(d3.axisLeft(yLine))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("yLine", 0 - marginLine.left)
        .attr("xLine",0 - (heightLine / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Density");


    // movie lines
    var selection = getSelection();
    var movie = svgLine.selectAll(".movie")
        .data(selection);

    movieLine =
        movie.enter()
        .append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); });

        movieLine.on("mouseout", function(){
            d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
        });
        svgLine.selectAll(".line").on("mouseover", function(){
            d3.select(this)
                .style({"stroke-opacity":"1","stroke-width":"1px"});
        });

    movieLabel =
    movie.enter()
        .append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + xLine(d.value.age) + "," + yLine(d.value.density) + ")"; })
        .attr("xLine", 3)
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
        //selection = selection[0];
    }
    //selection.forEach(function(d){console.log(d.title);});
    return selection;
}

function updateLine(error, data) {
    var selection = getSelection();

    movieLine.remove();
    movieLabel.remove();


    var movie = svgLine.selectAll(".movie")
        .data(selection);

    movieLine = movie.enter()
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

    movieLabel =
    movie.enter()
        .append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + xLine(d.value.age) + "," + yLine(d.value.density) + ")"; })
        .attr("xLine", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) {
            return "id:" + d.id + ", title:" + d["title"];
        });
}


