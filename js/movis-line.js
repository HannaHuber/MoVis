/**
 * Created by Hanna on 03.06.2017.
 */

var selectedYear = 1950; //document.getElementById("selectYear").value;
var selectedGenre = document.getElementById("selectGenre").value;
var selectedGender = document.getElementById("selectGender").value;
var isAverage = false; //document.getElementById("checkboxAverage").checked;

var svgLine = d3.select("#svgLine"),
    marginLine = { top: 10, right: 50, bottom: 50, left: 50 },
    widthLine = svgLine.attr("width") - marginLine.left - marginLine.right,
    heightLine = svgLine.attr("height") - marginLine.top - marginLine.bottom,
    gLine = svgLine.append("g").attr("transform", "translate(" + marginLine.left + "," + marginLine.top + ")");

var xLine = d3.scalePoint().range([0, widthLine]),
    yLine = d3.scaleLinear().range([heightLine, 0]);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) {
        return xLine(d[currentY]); })
    .y(function (d) {
        return yLine(d.density); });

var movieLine,
	movieLabel,
    pdf;

function updateFilter(){
    selectedYear = document.getElementById("selectYear").value;
    selectedGenre = document.getElementById("selectGenre").value;
    selectedGender = document.getElementById("selectGender").value;
    isAverage = document.getElementById("checkboxAverage").checked;
    console.log(selectedYear);

    // Remove old lines
    movieLine.remove();
    movieLabel.remove();

    // Draw new lines
    var selection = getSelection();
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
            .attr("transform", function (d) { return "translate(" + xLine(d.value[currentY]) + "," + yLine(d.value.density) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(function (d) {
                return "id:" + d.id + ", title:" + d["title"];
            });
}

function getCurrentPDF(){
    if (currentY == "age") {
        return pdfAge;
    } else if (currentY == "gender") {
        return pdfGender;
    } else {
        return pdfOrigin;
    }
}

/*
 * Draw initial line chart
 */
function initLine() {
    console.log("Initializing line chart...");

    // Get current pdf data
    pdf = getCurrentPDF();

    // Add items to dropdown menu
    var dropdown = document.getElementById("selectYear");
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
    dropdown = document.getElementById("selectGenre");
    genres.forEach(function(d){
        option = document.createElement("option");
        option.text = d.key;
        dropdown.add(option);
    });

    // Axes domain
    xLine.domain(
        pdf.map(function (c){return c.values.map(function (d){return d[currentY]})})[0]
        //d3.extent(pdf.map(function (c){return c.values.map(function (d){return d[currentY]})})[0])
    );
    yLine.domain([
        d3.min(pdf, function (c) { return d3.min(c.values, function (d) { return d.density; }); }),
        d3.max(pdf, function (c) { return d3.max(c.values, function (d) { return d.density; }); })
    ]);

    // Draw axes
    gLine.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + heightLine + ")")
        .call(d3.axisBottom(xLine).ticks(10))
        .append("text")
        .attr("transform",
            "translate(" + (widthLine/2) + " ," +
            (heightLine + marginLine.top ) + ")")
        .style("text-anchor", "middle")
        .text("Age");
    gLine.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yLine).ticks(10, "%"))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLine.left)
        .attr("x",0 - (heightLine / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Density");


    // Draw movie lines
    var selection = getSelection();
    var movie = gLine.selectAll(".movie")
        .data(selection);
    movieLine =
        movie.enter()
        .append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); });
    movieLine.on("mouseout", function(){
        d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
    });
    movie.selectAll(".line").on("mouseover", function(){
        d3.select(this)
            .style({"stroke-opacity":"1","stroke-width":"1px"});
    });

    // Draw labels
    movieLabel =
    movie.enter()
        .append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + xLine(d.value[currentY]) + "," + yLine(d.value.density) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) {
            return "id:" + d.id + ", title:" + d["title"];
        });

    console.log("Done.");
}

/*
* Calculate filtered data
*/
function getSelection() {
    console.log("Filtering year: " + selectedYear);
    console.log("Filtering genre: " +selectedGenre);

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
                    age:d[currentY],
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

    // Remove old lines + axes
    movieLine.remove();
    movieLabel.remove();
    svgLine.selectAll(".axis.axis--x").remove();
    svgLine.selectAll(".axis.axis--y").remove();

    // Draw new lines
    initLine();
}


