/**
 * Created by Hanna on 04.06.2017.
 */

var currentX = document.getElementById("selectX").value;
currentY= document.getElementById("selectY").value;
var firstBinIdx = 0;

var movieSerie,
    movieLegend,
    svgBar;
var legendColumnScale = {
    age: 5,
    gender: 4,
    origin: 18
};



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
            .entries(cast)
            .map(function(d) {
                var barData = {};
                barData.xKey = +d.key;
                columns.forEach (function(c){
                    barData[c] = d.value[c];
                });
                return barData;
            });
    } else {
        var genres = getGenreList(cast);
        var xValues = [];
        genres.forEach(function(g, i) {
            // Get all movies of the genre
            var group = cast
                .filter(function (c) {
                    return c.genres.includes(g);
                });
            // Calculate mean over all movies for each y
            var gMeans = {};
            gMeans.xKey = g;
             columns.forEach (function (o){
                 gMeans[o] = d3.mean(group, function(d) {
                     return d[o]; });
             });
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

function getCast(){
    if (currentY == "age") {
        return castAge;
    } else if (currentY == "gender") {
        return castGender;
    } else {
        return castOrigin;
    }
}

function getZValue(){
    // quantitative -last field is unknown
    if (currentY == "age") {
        var seqColors = [];
        d3.range(0,columnsAge.length -2).forEach(function(i){
            seqColors.push(d3.interpolateBlues(i/(columnsAge.length-2)));
        });
        seqColors.push(d3.interpolateBlues(1));
        seqColors.push("grey");

        return d3.scaleOrdinal()
                .range(seqColors)
                .domain(columnsAge);
    // categorical - last one unknown
    } else if (currentY == "gender") {
        return d3.scaleOrdinal()
            .range(["indianred","steelblue","grey"])
            .domain(columnsGender);

    // categorical - last two ambiguous/unknown
    } else {
        var catPool = ["rgb(57,146,131)", "rgb(73,237,201)", "rgb(11,82,46)", "rgb(95,224,99)",
            "rgb(106,144,18)", "rgb(202,219,165)", "rgb(53,97,143)", "rgb(140,171,234)",
            "rgb(25,50,191)", "rgb(206,43,188)", "rgb(255,168,255)", "rgb(111,47,95)",
            "rgb(132,109,255)", "rgb(194,99,159)", "rgb(134,1,238)", "rgb(214,220,68)",
            "rgb(122,48,3)", "rgb(254,201,175)", "rgb(214,6,26)", "rgb(243,125,33)",
            "rgb(165,122,106)", "rgb(251,189,19)", "rgb(82,70,31)", "rgb(250,33,127)",
            "rgb(171,123,5)", "rgb(114,229,239)", "rgb(8,87,130)", "rgb(106,159,238)",
            "rgb(103,35,150)", "rgb(202,148,253)", "rgb(125,10,246)", "rgb(235,103,249)",
            "rgb(123,63,91)", "rgb(56,240,172)", "rgb(32,80,46)", "rgb(167,232,49)",
            "rgb(86,145,96)", "rgb(171,210,141)", "rgb(33,167,8)", "rgb(44,245,43)",
            "rgb(132,84,26)", "rgb(226,209,203)", "rgb(236,75,24)", "rgb(244,142,155)",
            "rgb(220,44,122)", "rgb(244,148,70)", "rgb(234,214,36)","rgb(174,227,154)",
            "rgb(25,79,70)", "rgb(147,208,226)", "rgb(55,141,174)", "rgb(79,66,171)",
            "rgb(174,115,251)", "rgb(223,204,250)", "rgb(142,46,92)", "rgb(184,129,154)",
            "rgb(251,9,152)", "rgb(101,139,251)", "rgb(43,25,217)", "rgb(33,240,182)",
            "rgb(11,164,126)", "rgb(120,238,90)", "rgb(101,161,14)", "rgb(93,64,48)",
            "rgb(236,152,80)", "rgb(185,68,20)", "rgb(251,45,76)", "rgb(225,217,54)",
            "rgb(127,136,97)", "rgb(238,116,186)", "rgb(219,43,238)"];
        var catColors = [];
        d3.range(0,columnsOrigin.length -2 ).forEach(function(h) {
            /*catColors.push(d3.hcl(Math.floor(h /4) + 90 * (h % 4), 50, 70));
             });*/
            catColors.push(catPool[h % catPool.length]);
        });
        catColors.push("lightgrey");
        catColors.push("grey");
        //d3.shuffle(catColors);
        return d3.scaleOrdinal()
            .range(catColors)
            .domain(columnsOrigin);
    }
}

function initBar() {

    // Get data for selected attribute
    columns = getYColumns();
    cast = getCast();


    console.log("Initializing bar chart...");

    // Chart dimension + position
    svgBar = d3.select("#svgBar");
    var  margin = { top: 50, right: 500, bottom: 50, left: 50 },
        width = svgBar.attr("width") - margin.left - margin.right,
        height = svgBar.attr("height") - margin.top - margin.bottom,
        g = svgBar.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Prep the tooltip bits, initial display is hidden
    var tooltip = svgBar.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 60)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.5);

    tooltip.append("text")
        .attr("x", 30)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

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
    var selection = getXValues(cast, columns);

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
        .attr("width", bandWidth)
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d,i) {
            var xPosition = d3.mouse(this)[0] - 5;
            var yPosition = d3.mouse(this)[1] - 5;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(
                d3.select(this.parentNode).datum().key + ":\n" + Math.round(1000*(d[1]-d[0])/10) + "%"
            );
        });

    // Draw axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(-" + bandWidth/2 +" ," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", 'rotate(45)translate(8,-3)');//
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "%"));

    // Draw legend
    var legendRectSize = 10;
    var legendSpacing = 4;
    movieLegend = g.selectAll('.legend')
        .data(z.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            //var height = legendRectSize + legendSpacing;
            var dx = 24 + legendColumnScale[currentY]*(Math.floor((i * legendRectSize) / height))* bandWidth + x(x.domain()[x.domain().length -1]);
            var dy = (i * legendRectSize) % height;
            return 'translate(' + dx + ',' + dy + ')';
        });
    movieLegend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', z);
    movieLegend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .style("font", "8px sans-serif")
        .text(function(d) { return d; });

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