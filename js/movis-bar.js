/**
 * Created by Hanna on 04.06.2017.
 */

var currentX = document.getElementById("selectX").value;
currentY= document.getElementById("selectY").value;
var firstBinIdx = 0;

var movieSerie,
    movieLegend,
    svgBar;

function getGenreList(data){
    var genreArrays = d3.nest()
        .key(function (d){return d.genres;})
        .entries(data).map(function(d){return d.key;});
    var genreArray = [];
    genreArrays.forEach(function(d){
        genreArray = genreArray.concat(d.split(","));
    });
    return d3.nest()
        .key(function(d){return d})
        .entries(genreArray)
        .sort(function(x,y){return d3.ascending(x.key,y.key)})
        .map(function(d){return d.key});
}

function getXKey(d) {
    if (currentX == "year") {
        return d.year;
    } else {
        return d.genres;
    }
}

function getXValues(pdfRow, columns){
    if (currentX == "year") {
        return d3.nest()
            .key(function (d){return getXKey(d);})
            .sortKeys(d3.ascending)
            .rollup(function(v) {
                var barData ={}         ;
                columns.forEach (function(c){
                    barData[c] = d3.mean(v, function(d) {
                        return d[c]; });
                });
                return  barData;
            })
            .entries(pdfRow)
            .map(function(d) {
                var barData = {};
                barData.xKey = +d.key;
                columns.forEach (function(c){
                    barData[c] = d.value[c];
                })
                return barData;
            });
    } else {
        var genres = getGenreList(pdfRow);
        var xValues = [];
        genres.forEach(function(g, i) {
            // Get all movies of the genre
            var group = pdfRow
                .filter(function (c) {
                    return c.genres.includes(g);
                });
            // Calculate mean over all movies for each y
            var gMeans = {};
            gMeans.xKey = g;
             columns.forEach (function (o){
                 gMeans[o] = d3.mean(group, function(d) {
                     return d[o]; });
             })
            xValues[i] = gMeans;
        });
        console.log(xValues);
        return xValues;
    }
}

function getYColumns(){
    if (currentY == "age") {
        return columnsAge;
    } else if (currentY == "gender") {
        return columnsGender;
    } else {
        return columnsOrigin;
    }
}

function getPDFRow(){
    if (currentY == "age") {
        return pdfRowAge;
    } else if (currentY == "gender") {
        return pdfRowGender;
    } else {
        return pdfRowOrigin;
    }
}

function getZValue(){
    // quantitative -last field is unknown
    if (currentY == "age") {
        var seqColors = [];
        d3.range(0,13).forEach(function(i){
            seqColors[i] = d3.interpolateBlues(i/13);
        });
        seqColors[13] =  d3.interpolateBlues(1);
        return d3.scaleQuantize()
                .range(seqColors)
                .domain(d3.extent(columnsAge.slice(0,columnsAge.length-1)));
    // categorical - last one unknown
    } else if (currentY == "gender") {
        return d3.scaleOrdinal()
            .range(["indianred","steelblue"])
            .domain(columnsGender.slice(0,columnsAge.length-1));

    // categorical - last two ambiguous/unknown
    } else {
        var cat = [];
        d3.range(0,columnsOrigin.length -2 ).forEach(function(h){
            cat.push(d3.hcl((h * 360/(columnsOrigin.length -2)) % 360, 50, 70));
            //cat.push(d3.hcl((h * 360/(columnsOrigin.length -2) + (h%5)*180) % 360, 50, 70));
        });

        return d3.scaleOrdinal()
            .range(d3.shuffle(cat))
            /*["steelblue","indianred","#8dd3c7","#ffffb3",
            "#bebada","#fdb462","#b3de69","#fccde5",
            "#bc80bd","#ccebc5","#ffed6f"]*/
            .domain(columnsOrigin.slice(0,columnsOrigin.length-2));
    }
}

function initBar() {

    // Get data for selected attribute
    columns = getYColumns();
    pdfRow = getPDFRow();


    console.log("Initializing bar chart...");

    // Chart dimension + position
    svgBar = d3.select("#svgBar");
    var  margin = { top: 10, right: 50, bottom: 50, left: 50 },
        width = svgBar.attr("width") - margin.left - margin.right,
        height = svgBar.attr("height") - margin.top - margin.bottom,
        g = svgBar.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Axes range
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.01)
        .align(0.1);
    var bandWidth = 8;
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);
    var z = getZValue();

    // Stack data
    var stack = d3.stack()
        .offset(d3.stackOffsetExpand);
    var selection = getXValues(pdfRow, columns);

    // X-axis domain
    x.domain(selection.map(function(d) { return d.xKey; }));

    // Draw Bars
    movieSerie = g.selectAll(".serie")
        .data(stack.keys(columns.slice(firstBinIdx))(selection))
        .enter().append("g")
        .attr("class", "serie")
        .attr("fill", function(d) {
            if (d.key=="Unknown"){return "grey";}
            else if (d.key=="Ambiguous"){return "lightgrey";}
            else {
                return z(d.key);
                }

        });
    movieSerie.selectAll("rect")
        .data(function(d) {
            return d; })
        .enter().append("rect")
        .attr("x", function(d) {
            return x(d.data.xKey);})
        .attr("y", function(d) {
            return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", bandWidth);

    // Draw axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(-" + bandWidth/2 +" ," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", 'translate(-10,10)rotate(-45)');
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "%"));

    // Draw legend
    movieLegend = movieSerie.append("g")
        .attr("class", "legend")
        .attr("transform", function(d) { var d = d[d.length - 1]; return "translate(" + (x(d.data.xKey) + bandWidth) + "," + ((y(d[0]) + y(d[1])) / 2) + ")"; });
    movieLegend.append("line")
        .attr("x1", -6)
        .attr("x2", 6)
        .attr("stroke", "#000");
    movieLegend.append("text")
        .attr("x", 9)
        .attr("dy", "0.35em")
        .attr("fill", "#000")
        .style("font", "10px sans-serif")
        .text(function(d) { return d.key; });

    console.log("Done.");
}

function updateBar(){
    // Get selected axes
    currentX = document.getElementById("selectX").value;
    currentY = document.getElementById("selectY").value;

    // Remove old bars
    movieSerie.remove();
    movieLegend.remove();
    svgBar.selectAll(".axis.axis--x").remove();
    svgBar.selectAll(".axis.axis--y").remove();

    initBar();
}