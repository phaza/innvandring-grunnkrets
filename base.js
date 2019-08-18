if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

function getUrl(url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url);
    
    oReq.addEventListener('load', function() {
        callback(this);
    });
    oReq.send();
}


function between(one, two, check) {
  return check >= one && check < two;
}

function getColor(share) {
  if (isNaN(share)) return '#FEFCFE';
  if (between(0, 20, share)) return '#DEB8A8';
  if (between(20, 40, share)) return '#BECD7E';
  if (between(40, 60, share)) return '#54BB54';
  if (between(60, 80, share)) return '#2AA894';
  if (between(80, 100, share)) return '#003094';
}

var myStyle = {
  "color": "#888",
  "weight":1,
  "fillOpacity": 0.44,
};

function round(num) {
  if(isNaN(num)) return "-";
  return Math.round(num * 100) / 100 + '%';
}

function formatArea(name, westernShare, nonWesternShare, immigrantShare, nonImmigrantShare) {
  return '<h3>' + name + '</h3><p>Vestlige innvandrere: ' + round(westernShare) + ' <br>Ikke-vestlige innvandrere: ' + round(nonWesternShare) + ' <br>Innvandrere: ' + round(immigrantShare) + ' <br>Ikke-innvandrere: ' + round(nonImmigrantShare) + ' </p>';
}

function loadData(url, callback, areas, onMouseOver, onMouseOut) {
  getUrl(url, function(data) {
    var json = JSON.parse(data.responseText);
    var geo = json.features;
    var lg = L.layerGroup();
    
    lg.addLayer(L.geoJSON(geo, {
      style: function(feature) {
          var gno = feature.properties.grunnkretsnummer;
          var area = areas[gno];
          var style = Object.assign({}, myStyle);
          
          if (area) {
            var colorCode = parseInt(area["immigrant-share"])

            if(typeof(colorCode) !== 'undefined') {
              style.fillColor = getColor(colorCode);
            }
          }
          
          return style;
      },
      coordsToLatLng: function(coords) {
          return L.Projection.UTM33.unproject({x: coords[0], y: coords[1]});
      },
      onEachFeature: function(feature, layer) {
        var name = feature.properties.grunnkretsnavn;
        var no = feature.properties.grunnkretsnummer;
        var area = areas[no];

        var areaText = "<p>Data ikke tilgjenglig</P>";

        if (area) {
          var westernShare = area["western-share"];
          var nonWesternShare = area["non-western-share"];
          var immigrantShare = area["immigrant-share"];
          var nonImmigrantShare = area["non-immigrant-share"];
          areaText = formatArea(name, westernShare, nonWesternShare, immigrantShare, nonImmigrantShare);
        }
        
        var coords = feature.geometry.coordinates.map(function(v, i) {
          return L.Projection.UTM33.unproject({x: v[i][0], y: v[i][1]});
        });

        

        if(!L.Browser.mobile) {
          layer.bindTooltip(areaText, {
            direction: 'center',
            // sticky: true
          });
        }
        else {
          var onClick = function(e) {
            onMouseOver(price)(e);
  
            layer.once('click', function(e) {
              onMouseOut(e);
              layer.once('click', onClick);
            })
          }
  
          layer.once('click', onClick);
        }

      }
    }));

    callback(lg);
  });
}
