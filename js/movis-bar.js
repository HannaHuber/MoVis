/**
 * Created by Hanna on 04.06.2017.
 */

function initBar(columns) {

    // Chart dimension + position
    var svgBar = d3.select("#svgBar"),
        margin = { top: 10, right: 50, bottom: 50, left: 50 },
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
    var seqColors = [];
    for (var i=0; i<13;++i){
        seqColors[i] = d3.interpolateBlues(i/13);
    }
    seqColors[13] =  d3.interpolateBlues(1);
    var z = d3.scaleQuantize()
        .range(seqColors);

    // Stack data
    var stack = d3.stack()
        .offset(d3.stackOffsetExpand);
    var firstBinIdx = 1;
    var selection =
        d3.nest()
            .key(function (d){return d.year;})
            .sortKeys(d3.ascending)
            .rollup(function(v) {
                var barData ={}         ;
                for (var i=firstBinIdx; i< columns.length; i++){
                    barData[columns[i]] = d3.mean(v, function(d) {
                        return d[columns[i]]; });
                }
                return  barData;
            })
            .entries(pdfRow)
            .map(function(d) {
                var barData = {};
                barData.year = +d.key;
                for (var i = firstBinIdx; i < columns.length; i++) {
                        barData[columns[i]] = d.value[columns[i]];
                }
                return barData;
            });

    // Axes domain
    x.domain(selection.map(function(d) { return d.year; }));
    z.domain(d3.extent(columns.slice(2)));

    // Bars
    var serie = g.selectAll(".serie")
        .data(stack.keys(columns.slice(firstBinIdx))(selection))
        .enter().append("g")
        .attr("class", "serie")
        .attr("fill", function(d) {
            if (d.key=="-1"){return "grey";}
            else {
                return z(d.key);
                }

        });
    serie.selectAll("rect")
        .data(function(d) {
            return d; })
        .enter().append("rect")
        .attr("x", function(d) {return x(d.data.year);})
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", bandWidth);

    // Append axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(-" + bandWidth/2 +" ," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", 'translate(-10,10)rotate(-45)');
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "%"));

    // Append legend
    var legend = serie.append("g")
        .attr("class", "legend")
        .attr("transform", function(d) { var d = d[d.length - 1]; return "translate(" + (x(d.data.year) + bandWidth) + "," + ((y(d[0]) + y(d[1])) / 2) + ")"; });
    legend.append("line")
        .attr("x1", -6)
        .attr("x2", 6)
        .attr("stroke", "#000");
    legend.append("text")
        .attr("x", 9)
        .attr("dy", "0.35em")
        .attr("fill", "#000")
        .style("font", "10px sans-serif")
        .text(function(d) { return d.key; });
}