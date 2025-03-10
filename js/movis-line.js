/**
 * Created by Hanna on 03.06.2017.
 */

// User selections
var selectedYear = document.getElementById("selectYear").value;
var selectedGenre = document.getElementById("selectGenre").value;
var selectedGender = document.getElementById("selectGender").value;
var isAverage = document.getElementById("checkboxAverage").checked;

// Line chart
var svgLine = d3.select("#svgLine"),
    marginLine = { top: 20, right: 100, bottom: 100, left: 40 },
    widthLine = svgLine.attr("width") - marginLine.left - marginLine.right,
    heightLine = svgLine.attr("height") - marginLine.top - marginLine.bottom,
    gLine = svgLine.append("g").attr("transform", "translate(" + marginLine.left + "," + marginLine.top + ")");

// Axis functions
var xLine = d3.scalePoint().range([0, widthLine]),
    yLine = d3.scaleLinear().range([heightLine, 0]);

// Path function
var line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) {
        return xLine(d[currentY]); })
    .y(function (d) {
        return yLine(d.density); });

// Path, axis and label variables
var movieLine,
    movieLineCompare,
	movieLabel,
    xLabelLine,
    titleLine,
    pdf,
    pdfF,
    pdfM;

// Tooltip for details on demand
var tooltipLine = svgLine.append("g")
    .attr("class", "tooltip")
    .style("display", "none");
tooltipLine.append("rect")
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "white")
    .style("opacity", 0.5);
tooltipLine.append("text")
    .attr("x", 30)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");

/*
* Gets current user selection of filters and updates paths
 */
function updateFilter(){
    // Get user selection
    selectedYear = document.getElementById("selectYear").value;
    selectedGenre = document.getElementById("selectGenre").value;
    selectedGender = document.getElementById("selectGender").value;
    isAverage = document.getElementById("checkboxAverage").checked;

    // Remove old lines and labels
    if (movieLine != null){movieLine.remove();}
    if (movieLineCompare != null){movieLineCompare.remove();}
    if (movieLabel != null){movieLabel.remove();}

    // Draw female lines in case of respective selection
    if (["f","cmp"].includes(selectedGender)){
        // Female lines in comparison mode are red
        drawLines(getSelection("f"), selectedGender=="cmp");
    }
    // Draw male lines in case of respective selection
    if (["m","cmp"].includes(selectedGender)){
        drawLines(getSelection("m"),false);
    }
    // Draw gender-unspecific lines otherwise
    if ("all" == selectedGender){
        drawLines(getSelection("all"),false);
    }
}
/*
 * Returns the pdf for the current attribute
 */
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
* Returns the female-specific pdf for the current attribute
 */
function getCurrentPDFFemale(){
    if (currentY == "age") {
        return pdfAgeF;
    } else {
        return pdfOriginF;
    }
}

/*
 * Returns the female-specific pdf for the current attribute
 */
function getCurrentPDFMale(){
    if (currentY == "age") {
        return pdfAgeM;
    } else {
        return pdfOriginM;
    }
}

/*
 * Draw initial line chart
 */
function initLine() {
    console.log("Initializing line chart...");

    // Get current pdf data
    pdf = getCurrentPDF();
    pdfF = getCurrentPDFFemale();
    pdfM = getCurrentPDFMale();

    // Init filter options
    addFilterMenu();

    // Init axes
    drawAxes();

    // Draw new lines
    if (["f","cmp"].includes(selectedGender)){
        drawLines(getSelection("f"), selectedGender=="cmp");
    }
    if (["m","cmp"].includes(selectedGender)){
        drawLines(getSelection("m"), false);
    }
    if ("all" == selectedGender){
        drawLines(getSelection("all"), false);
    }

    console.log("Done.");

    // Stop loader animation
    d3.selectAll('.spinningLine').classed('hidden', true);
}

/*
* Adds dropdown menu for filtering options
*/
function addFilterMenu(){
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
}

/*
* Draw x- and y-axis, labels and title
*/
function drawAxes(){
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
        .selectAll("text")
        .style("text-anchor", "start")
        .style("font", "8px sans-serif")
        .attr("transform", 'translate(8,0)rotate(45)');//
    xLabelLine = gLine.append("text")
           .attr("class", "label")
            .attr("x",(widthLine/2))
            .attr("y", (heightLine + marginLine.top +marginLine.bottom/4))
            .text(
                currentY[0].toUpperCase() + currentY.slice(1)
            );
    gLine.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yLine).ticks(10, "%"))
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLine.left)
        .attr("x",0 - (heightLine / 2))
        .attr("dy", "1em")
        .text("Density");

    // Chart title
    titleLine = gLine.append("text")
        .attr("x", (widthLine / 2))
        .attr("y", 0 - (marginLine.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(
            "Individual "
            + currentY[0].toUpperCase() + currentY.slice(1)
            + " Distributions"
        );
}
/*
* Draw movie lines
*/
function drawLines(selection, isCompare){

    if (selection.length == 0){
        console.log("Sorry, no movies match this selection. Choose different filter options.");
        return;
    }

    // Draw comparison movie lines
    if (isCompare){
        movieLineCompare = gLine.selectAll(".movieCompare")
            .data(selection)
            .enter().append("g")
            .attr("class", "movieCompare");

        movieLineCompare.append("path")
            .attr("class", "line-compare")
            .attr("d", function (d) { return line(d.values); });

        movieLineCompare.selectAll('.line-compare')
            .on("mouseout", function(){
                d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
            })
            .on("mouseover", function(){
                d3.select(this).style({"stroke-opacity":"1","stroke-width":"1px"});
            })
            .on("mousemove", function(d) {
                var xPosition = d3.mouse(this)[0] - 5;
                var yPosition = d3.mouse(this)[1] - 5;
                tooltipLine.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                tooltipLine.select("text").text(
                    d.x + ":\n" + Math.round(1000*(d.y))/10 + "%"
                );
            });
        // Highlight if only average line is drawn
        if (isAverage && movieLineCompare != null){
            movieLineCompare.selectAll('.line-compare')
                .attr("stroke-opacity","1")
                .attr("stroke-width","1px");
            }
    }

    // Draw regular movie lines
    else  {
        movieLine = gLine.selectAll(".movie")
            .data(selection)
            .enter().append("g")
            .attr("class", "movie");

        movieLine.append("path")
            .attr("class", "line")
            .attr("d", function (d) { return line(d.values); })
            .on("mouseout", function(){
                d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
            })
            .on("mouseover", function(){
                d3.select(this).style({"stroke-opacity":"1","stroke-width":"1px"});
            })
            .on("mousemove", function(d) {
                var xPosition = d3.mouse(this)[0] - 5;
                var yPosition = d3.mouse(this)[1] - 5;
                tooltipLine.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                tooltipLine.select("text").text(
                    d.x + ":\n" + Math.round(1000*(d.y))/10 + "%"
                );
            });
        // Highlight if only average line is drawn
        if (isAverage && movieLine != null){
            movieLine.selectAll('.line').style({"stroke-opacity":"1","stroke-width":"1px"
            });}

    }

    // Draw labels
    movieLabel =
        gLine.enter()
            .append("text")
            .datum(function (d) { return { id: d.id, title: d.title, value: d.values[d.values.length - 1] }; })
            .attr("transform", function (d) { return "translate(" + xLine(d.value[currentY]) + "," + yLine(d.value.density) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(function (d) {
                return "id:" + d.id + ", title:" + d.title;
            });
}
/*
* Calculate filtered data
*/
function getSelection(gender) {

    // Choose distribution
    var selection;
    if (gender == "f"){
        selection = pdfF;
    } else if (gender=="m"){
        selection = pdfM;
    } else {
        selection = pdf;
    }

    // Filter if selected
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

    // Average if selected
    if (isAverage) {
        selection =  selection.map(function (c) {
            var meanDensities = [];
            for (var k = 0; k < c.values.length; ++k) {
                meanDensities[k] = d3.mean(selection.map(function (c) {
                    return c.values;}).map(function(d,i){return d[k];}), function(d){return d.density;});
            }
            var tmp = c.values.map(function(d,i) {
                data = {};
                data[currentY] = d[currentY];
                data["density"] = meanDensities[i];
                return data;
            });
            return {
                id:"-",
                title:"-",
                year:selectedYear,
                genres:selectedGenre,
                values: tmp
                };
        });
        selection = [selection[0]];
    }
    return selection;
}

/*
* Update line chart if x-axis changed
 */
function updateLine(error, data) {

    // Remove old lines + axes + title
    if (movieLine != null){movieLine.remove();}
    if (movieLineCompare != null){movieLineCompare.remove();}
    if (movieLabel != null){movieLabel.remove();}
    if (xLabelLine != null){xLabelLine.remove();}
    if (titleLine != null){titleLine.remove();}
    if (svgLine.selectAll(".axis.axis--x") != null){svgLine.selectAll(".axis.axis--x").remove();}
    if (svgLine.selectAll(".axis.axis--y") != null){svgLine.selectAll(".axis.axis--y").remove();}

    // Draw new lines
    initLine();
}


