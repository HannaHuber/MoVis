/**
 * Created by Hanna on 04.06.2017.
 */

var svgBar = d3.select("#svgBar"),
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    width = svgBar.attr("width") - margin.left - margin.right,
    height = svgBar.attr("height") - margin.top - margin.bottom,
    g = svgBar.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .range([0, width])
    .padding(0.01)
    .align(0.01);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var seq = [];
for (var i=0; i<8;++i){
    seq[i] = d3.interpolateBlues(i/8);
}
seq[8] =  d3.interpolateBlues(1);
var z = d3.scaleOrdinal()
    .range(seq);

var stack = d3.stack();
    //.offset(d3.stackOffsetExpand);

var firstBinIdx = 1;


function initBar(columns) {
    var selection =
        d3.nest()
            .key(function (d){return d.year;})
            .sortKeys(d3.ascending)
            .rollup(function(v) {
                var x={}         ;
                for (var i=firstBinIdx; i< columns.length; i++){
                    x[columns[i]] = d3.mean(v, function(d) {
                        return d[columns[i]]; });
                }
                return  x;
            })
            .entries(pdfRow)
            .map(function(d) {
                var x = {};
                x.year = +d.key;
                for (var i = firstBinIdx; i < columns.length; i++) {

                        x[columns[i]] = d.value[columns[i]];
                }
                return x;
            });


    x.domain(selection.map(function(d) { return d.year; }));
    z.domain(columns.slice(firstBinIdx));
    //z.domain(d3.range(0,131));

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
        .attr("x", function(d) {
            return x(d.data.year);
        })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) {
            return y(d[0]) - y(d[1]); })
        .attr("width", 6);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "%"));

    var legend = serie.append("g")
        .attr("class", "legend")
        .attr("transform", function(d) { var d = d[d.length - 1]; return "translate(" + (x(d.data.year) + 6) + "," + ((y(d[0]) + y(d[1])) / 2) + ")"; });

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