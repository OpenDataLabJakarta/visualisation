// main.js
var width = 500,
    height = 500;

var projection = d3.geo.mercator()
   .center([106.664723, -6.048146]) 
   .scale(90000)
   .translate([0, -40]);

var path = d3.geo.path()
   .projection(projection);

var svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height);

var legend = d3.select('#legend')
      .append('ul')
      .attr('class', 'list-inline');

var dataset = "Jumlah Insiden";
queue()
   .defer(d3.json, "../res/jakarta_by_kelurahan.topo.json")
   .defer(d3.csv, "../res/incident_summary.csv")
   .defer(d3.csv, "../res/fire_stations.csv")
   .await(ready);

function ready(error, jakarta, incidents, stations) {
   var kelurahan = topojson.feature(jakarta, jakarta.objects.kelurahan);

   //intializing data
   incidents.forEach(function(i) {
      var kel = kelurahan.features.filter(function(d) {
         return d.id === i.kelurahan.toUpperCase(); 
      })[0];

      if (kel) {
         kel.numOfIncidents = i.total_insiden;
         kel.numOfDeaths = i.total_petugas_mati + i.total_masyarakat_mati;
         kel.numOfHurts = i.total_petugas_luka+ i.total_masyarakat_luka;
      }  
   });

   initMap(kelurahan, jakarta, stations);
   initLegend("Jumlah Insiden");
   
   //init selectmenu
   $("#dataset").selectmenu({
      width: 200,
      select: function(event, ui) {
         dataset = ui.item.value;
         initMap(kelurahan, jakarta, stations);
         initLegend();  
      } 
   });
};

function initMap(kelurahan, jakarta, stations) {
   var fill = initColorMapping(dataset);

   var map = svg.append("g")
         .attr("class", "regencies")
      .selectAll("path")
         .data(kelurahan.features);

   svg.append("path")
      .datum(topojson.mesh(jakarta, jakarta.objects.kelurahan, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

   svg.append("g")
         .attr("class", "fire-stations")
      .selectAll("circle")
         .data(stations)
      .enter()
         .append("circle")
         .attr("r",3)
         .attr("transform", function(d) { return "translate(" + projection([d.longitude,d.latitude]) + ")"; });

   var mapEnter = map.enter().append("path")
         .attr("d", path)
         .attr("label", function(d) { return d.id; });

   var mapUpdate = map
         .style("fill-opacity", 1)
         .attr("fill", function(d) { 
            switch(dataset) {
               case "Jumlah Insiden":
                  return fill(d.numOfIncidents);
               case "Jumlah Korban Jiwa":
                  return fill(d.numOfDeaths);               
               case "Jumlah Korban Luka":
                  return fill(d.numOfHurts);
               default:
                  return fill(d.numOfIncidents);
            }
         });

   var mapExit = map.exit().transition()
         .delay(3000)
         .style("fill-opacity", 0)
         .remove();

   initTooltip(dataset);
}

function initLegend() {
   var fill = initColorMapping(dataset);   

   var keys = legend.selectAll('li.key')
      .data(fill.range());

   var keyEnter = keys.enter().append('li')
         .attr('class', 'key')
         .style('border-top-color', String);

   var keyUpdate = keys
         .text(function(d) {
            var r = fill.invertExtent(d);
            return r[0];
         });

   var keyExit = keys.exit().remove();
}

function initColorMapping() {
   var fill = d3.scale.quantize()
      .domain([0, 70])
      .range(colorbrewer.Reds[7]);

   switch(dataset) {
      case "Jumlah Insiden":
         var fill = d3.scale.quantize()
            .domain([0, 70])
            .range(colorbrewer.Reds[7]);
            break;
      case "Jumlah Korban Jiwa":
         var fill = d3.scale.quantize()
            .domain([0, 9])
            .range(colorbrewer.Reds[9]);
            break;
      case "Jumlah Korban Luka":
         var fill = d3.scale.quantize()
            .domain([0, 90])
            .range(colorbrewer.Reds[9]);
            break;
   }
   return fill;
}

function initTooltip() {
   $('path').tipsy({ 
     gravity: 'w', 
     html: true, 
     title: function() {
       var d = this.__data__;
       switch(dataset) {
         case "Jumlah Insiden":
            var numOfIncidents = 0;
            if(d.numOfIncidents) numOfIncidents = d.numOfIncidents;
            return "Kelurahan : " + d.id + "</br>" 
                  + "Number of incidents : " + numOfIncidents; 
         case "Jumlah Korban Jiwa":
            var numOfDeaths = 0;
            if(d.numOfDeaths) numOfDeaths = d.numOfDeaths;
            return "Kelurahan : " + d.id + "</br>" 
                  + "Number of deaths : " + numOfDeaths;
         case "Jumlah Korban Luka":
            var numOfHurts = 0;
            if(d.numOfHurts) numOfHurts = d.numOfHurts;
            return "Kelurahan : " + d.id + "</br>" 
                  + "Number of deaths : " + numOfHurts;
         }
      }
   });   
}