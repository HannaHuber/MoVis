/**
 * Created by Hanna on 08.06.2017.
 */

function loadData(f2){
    d3.queue()
        .defer(d3.csv,"./data/age_all_id_1-15k_row.csv", parseAgeRow)
        .defer(d3.csv,"./data/age_all_id_1-15k_cs.csv", parseAge)
        .defer(d3.csv,"./data/movie_info.csv",parseInfo)
        .await(f2);
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
    console.log(data[0]);
    console.log(info[0]);

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
/*

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
            .attr("transform", function (d) { return "translate(" + x(d.value.age) + "," + y(d.value.density) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(function (d) {
                return "id:" + d.id + ", title:" + d["title"];
            });
*/

}