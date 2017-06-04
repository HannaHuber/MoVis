/**
 * Created by Hanna on 03.06.2017.
 */

var selectedID = document.getElementById("dropId").value;

var svg = d3.select("svg"),
    margin = { top: 20, right: 80, bottom: 30, left: 50 },
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return x(d.age); })
    .y(function (d) { return y(d.density); });

var movieLine,
	movieLabel;

loadData(parseAge, init);


function updateFilter(){
    selectedID = document.getElementById("dropId").value;
    console.log(selectedID);
    //movieLabel.remove();
    //movieLine.remove();
    loadData(parseAge,init);
}

function parseAge(data, _, columns) {
    data.age = +data.age;
    for (var i = 1, t = 0, c; i < columns.length; ++i) {
        data[c = columns[i]] =  +data[c];
    }
    return data;
}

function parseInfo(data, _, columns) {
    data.year = +data.year;
    data["title"] = data["title"];
    data["genres"] = data["genres"];
    return data;
}

function init(error, data) {
    if (error) { console.log(error); }
    console.log(data[0]);
	console.log(selectedID);
    var pdf = data.columns.slice(1,100).map(function (id) {
        return {
            id: id,
            values: data.map(function (d) {
                return { age: d.age, density: d[id]/d3.sum(data,function(d){return d[id]}) };
            })
        };
    });

    x.domain(
        d3.extent(data, function (d) { return d.age; })
    );
    y.domain([
        d3.min(pdf, function (c) { return d3.min(c.values, function (d) { return d.density; }); }),
        d3.max(pdf, function (c) { return d3.max(c.values, function (d) { return d.density; }); })
    ]);

    // Axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("transform",
            "translate(" + (width/2) + " ," +
            (height + margin.top ) + ")")
        .style("text-anchor", "middle")
        .text("Age");
    g.append("g")
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
     var movie = g.selectAll(".movie")
        .data(pdf)
        .enter().append("g")
        .filter(function(o){return o.id==selectedID})
        .attr("class", "movie");

     movieLine =
        movie.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .on("mouseout", function(){
            d3.select(this).style({"stroke-opacity":"0.5","stroke-width":"0.5px"});
        })
        .on("mouseover", function(){
            d3.select(this).style({"stroke-opacity":"1","stroke-width":"1px"});
        });

    movieLabel =
        movie.append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + x(d.value.age) + "," + y(d.value.density) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) { return d.id; });

}
/*
function update(error, data) {
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
    var svg = d3.select("svg").transition();

    // Make the changes
    svg.select(".line")   // change the line
        .duration(750)
        .attr("d", function (d) { return line(d.values); });
    svg.select(".x.axis") // change the x axis
        .duration(750)
        .call(d3.svg.axis().scale(x).orient("bottom"));
    svg.select(".y.axis") // change the y axis
        .duration(750)
        .call(d3.svg.axis().scale(y).orient("left"));

}*/

/*function updateFilter(){
    selectedID = document.getElementById("dropId").value;
	console.log(selectedID);
    loadData(parseAge,init);
}*/

function loadData(f1, f2){
    d3.request("./data/age_all_id_1-15k.csv")
        .mimeType("text/plain")
        .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText, f1)})
        .get(f2);

//d3.request("./raw/movie_meta.csv")
//   .mimeType("text/plain")
//   .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText, parseInfo

    /*d3.queue()
     //   .defer(readDSV, "./data/pdf/age_all_id_1-15k.csv", parseAge)
//.defer(readDSV, "./data/meta/movie_meta.csv", parseInfo)
//.awaitAll(draw);



.defer(d3.csv,"./data/age_all_id_1-15k_cs.csv", f1)
//   .defer(d3.csv,"./data/age_all_id_1-15k_cs_unknown15137.csv", f1)
//.defer(d3.csv,"./data.csv", type)
//.defer(d3.csv,"./data/pdf/originDF_all.csv")
//.defer(d3.csv, "./data/pdf/originDF_m.csv")
//.defer(d3.csv, "./data/pdf/originDF_f.csv")

//.defer(d3.csv,"./data/pdf/ageDF_m.csv")
//.defer(d3.csv,"./data/pdf/ageDF_f.csv")
//.defer(d3.csv,"./data/pdf/genderDF.csv")
.await(f2);*/
}


function readDSV(file, access) {
    d3.request(file)
    //.mimeType("text/plain")
        .response(function(xhr) {return d3.dsvFormat(";").parse(xhr.responseText,access )})
        .get(draw);
}




/* Dropdown menu */
//var selectID = document.getElementById("dropId");
//var selectedID = selectID.value;

/* When the user clicks on the button,
 toggle between hiding and showing the dropdown content
function myFunction() {
    document.getElementById("dropId").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {

        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}*/
