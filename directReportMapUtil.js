/**
 * 传入一个json对像，
 * 包括地图的ID：mapId,
 * 地图加载完成后的回调函数：callBack
 */
function MapUtils(option) {
    var mapDivId = "mapDiv";

    var provinceJsonData;
    var cityJsonData;
    var countyJsonData;

    var regionFlag = false;//区域选择按钮是否选择，默认没有选择
    var baseDistrict = option.baseDistrict;
    var userLevel = option.userLevel;

    MapUtils.map = this;
    /**
     * 地图加载完成后的回调函数
     */
    var onMapLoad = function () {
        clearMap();
        removeEsriLogo();
        if (option && undefined != option.callBack && "function" == typeof (option.callBack)) {
            option.callBack();
        }
    };
    /**
     * 地图参数设置
     */
    if ("undefined" != typeof (option) && "object" == typeof (option)) {
        if (null != option.mapDivId && "" != option.mapDivId) {
            mapDivId = option.mapDivId;
        }
    }
    var map, g_Map, g_WebTiledLayer, g_Draw, g_SimpleMarkerSymbol, g_Point, g_SimpleLineSymbol, toolBar, g_GeometryEngin,
        g_SimpleFillSymbol, g_CartographicLineSymbol, g_PictureMarkerSymbol, g_WebMercatorUtil,
        g_Graphic, g_Color, g_dom, g_on, g_JsonUtils, g_GraphicsLayer, g_Polygon, g_Polyline;
    /**
     * 引入地图模块
     */
    require([
        "esri/map",
        "esri/layers/WebTiledLayer",
        "esri/toolbars/draw",
        "esri/layers/GraphicsLayer",
        "esri/geometry/Point",
        "esri/geometry/webMercatorUtils",
        "esri/geometry/geometryEngine",

        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/CartographicLineSymbol",
        "esri/symbols/PictureMarkerSymbol",
        "esri/geometry/Polygon",

        "esri/graphic",
        "esri/Color",
        "dojo/dom",
        "dojo/on",
        "esri/geometry/jsonUtils",
        "esri/geometry/Polyline",
        "dojo/domReady!"
    ], function (Map, WebTiledLayer, Draw, GraphicsLayer, Point, WebMercatorUtils, GeometryEngine, SimpleMarkerSymbol,
        SimpleLineSymbol, SimpleFillSymbol, CartographicLineSymbol,
        PictureMarkerSymbol, Polygon, Graphic, Color, dom, on, JsonUtils, Polyline) {
        g_Map = Map;
        g_WebTiledLayer = WebTiledLayer;
        g_Draw = Draw;
        g_GraphicsLayer = GraphicsLayer;
        g_Point = Point;
        g_SimpleMarkerSymbol = SimpleMarkerSymbol;
        g_SimpleLineSymbol = SimpleLineSymbol;
        g_SimpleFillSymbol = SimpleFillSymbol;
        g_CartographicLineSymbol = CartographicLineSymbol;
        g_PictureMarkerSymbol = PictureMarkerSymbol;
        g_Polygon = Polygon;
        g_Graphic = Graphic;
        g_Color = Color;
        g_dom = dom;
        g_on = on;
        g_JsonUtils = JsonUtils;
        g_WebMercatorUtil = WebMercatorUtils;
        g_GeometryEngin = GeometryEngine;
        g_Polyline = Polyline;

        // var centerX = 116.382422;
        // var centerY = 39.91405;
        // var zoomLevel = 5;
        // if (baseDistrict && baseDistrict.length > 0) {
        //     if (JSON.stringify(baseDistrict).indexOf("rings") > -1) {
        //         var base = new g_Polygon(baseDistrict[0]);
        //         var baseCenter = base.getExtent().getCenter();
        //         //根据背景区域缩放等级
        //         var level = 0;
        //         var y = 300;
        //         while (level < 10) {
        //             if ((base.getExtent().ymax - base.getExtent().ymin) > y) {
        //                 break;
        //             }
        //             level += 1;
        //             y /= 2;
        //         }
        //         centerX = baseCenter.x;
        //         centerY = baseCenter.y;
        //         zoomLevel = level - 3;
        //     } else if (JSON.stringify(baseDistrict).indexOf("paths") > -1) {
        //         var base2 = new g_Polyline(baseDistrict[0]);
        //         var firstPoint = base2.getPoint(0, 0);
        //         centerX = firstPoint.x;
        //         centerY = firstPoint.y;
        //     } else if (JSON.stringify(baseDistrict).indexOf("x") > -1) {
        //         var base2 = new Point(baseDistrict[0]);
        //         centerX = base2.x;
        //         centerY = base2.y;
        //     }
        // }

        map = new g_Map("mapDiv", {
            center: [116.382422, 39.91405],
            zoom: 6
        });

        var webtiles1 = new g_WebTiledLayer("http://{subDomain}.tianditu.gov.cn/DataServer?T=vec_w&x={col}&y={row}&l={level}&tk=d5eab24a4d6dd934909b22de08f86d9f",
            {
                subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
            });

        var webtiles2 = new g_WebTiledLayer("http://{subDomain}.tianditu.gov.cn/DataServer?T=cva_w&x={col}&y={row}&l={level}&tk=d5eab24a4d6dd934909b22de08f86d9f",
            {
                subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
            });
        map.addLayer(webtiles1);
        map.addLayer(webtiles2);

        var gLa = new GraphicsLayer({ id: "a" });
        map.addLayer(gLa);

        // 加载事件
        onMapLoad();
        // 鼠标滚轮缩放等级
        map.on("zoom-end", onZoomEnd);
    }// end of function
    )//end of require

    //移除地图下边的esri logo
    function removeEsriLogo() {
        $("div[class='logo-med']").remove();
        $("div[class='logo-sm']").remove();
    }

    //添加图形到地图上
    function addGraphic(evt) {
        toolBar.deactivate();
        // 获取数据
        /**
         * jsonData为地图边界数据，该数据需从北京服务器内网中获取
         */
        var inter = m_intersect(evt, baseDistrict);
        var symbol;
        if (evt.geometry.type === "point") {
            /******************实心点（开始）********************/
            symbol = new g_SimpleMarkerSymbol(
                g_SimpleMarkerSymbol.STYLE_CIRCLE,
                8, new g_SimpleLineSymbol(
                    g_SimpleLineSymbol.STYLE_SOLID,
                    new g_Color([0, 0, 0, 0.5]),
                    4
                ),
                new g_Color([0, 0, 0, 0.9]));
            /******************实心点（结束）********************/
        }
        else if (evt.geometry.type === "polyline") {
            symbol = new g_SimpleLineSymbol();
        }
        else {
            /******************多边形合并（开始）*****************/
            // 改变多边形边界和中心圆颜色
            symbol = new g_SimpleFillSymbol(g_SimpleFillSymbol.STYLE_SOLID, new g_SimpleLineSymbol(g_SimpleLineSymbol.STYLE_SOLID, new g_Color([0, 0, 255, 0.9]), 2), new g_Color([96, 96, 96, 0.2]));
            //如果为面则与原有图形中的面合并

            inter = m_union(inter);
            /******************多边形合并（结束）*****************/
        }
        map.graphics.add(new g_Graphic(inter, symbol));
    }

    //切割图形  求交集
    function m_intersect(evt, jsonData) {
        var inter = g_WebMercatorUtil.webMercatorToGeographic(evt.geometry);
        //切割图形  start
        var base = new g_Polygon(jsonData[0]);
        inter = g_GeometryEngin.intersect(inter, base);
        //切割图形  end
        return inter;
    }

    //图型合并  求并集
    function m_union(inter) {
        for (var i in map.graphics.graphics) {
            if (map.graphics.graphics[i].geometry != null && map.graphics.graphics[i].geometry.type === "polygon") {
                var gra = map.graphics.graphics[i];
                map.graphics.remove(gra);
                inter = g_GeometryEngin.union([gra.geometry, inter]);
                break;
            }
        }
        return inter;
    }

    //清除地图上的所有图形
    function clearMap() {
        map.graphics.clear();
    }

    //点击全屏按钮的事件
    function mapFull() {
        if ($("#mapDiv").css("position") == "fixed") {
            $("#mapDiv").removeAttr("style");
            $("#mapDiv").css({ position: "relative" });
            $("#full").attr("title", "全屏");
        } else {
            $("#mapDiv").css({
                position: "fixed",
                top: "0px",
                left: "0px",
                right: "0px",
                bottom: "0px",
                width: "auto",
                height: "auto",
                "z-index": "10000",
                background: "rgba(255,255,255,1)",
                margin: "0px"
            });
            $("#full").attr("title", "退出全屏");
        }
    }

    //行政区划的点击事件
    function regionClick() {
        if (userLevel == 3) {
            if (MapUtils.map)
                MapUtils.map.showAreaMap(baseDistrict);
            return;
        }
        if ("block" == $("#mapRegion").css("display")) {
            $("#mapRegion").css("display", "none");
        } else {
            $("#mapRegion").css("display", "block");
        }
    }

    //哈希出一个RGB值
    function hslToRgb(h, s, l) {
        if (s == 0) {
            r = g = b = l; // achromatic
        }
        else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
    }

    //获取一个数据的最后一位，传入一个字符串的小数
    function getLastBit(data) {
        if ("string" == typeof (data)) {
            var tmp = data.substr(data.length - 1, 1);
            tmp = "0." + tmp;
            return parseFloat(tmp);
        }
        return 0;
    }

    //地图缩放时调用的函数
    function onZoomEnd(evt) {
        var zoomLevel = evt.level;
        if (undefined != option.zoomEndCallBack && "function" == typeof (option.zoomEndCallBack)) {
            option.zoomEndCallBack(zoomLevel);
        }
    }


    //============================================
    //以下部分是提供给外部用的地图操作相关的接口//
    //============================================

    //在地图上添加工具条
    this.addTooBar = function () {
        //var _html = ' <div style="width: 50px;height: 100px;border: solid black 2px;position: absolute; right: 50px;top: 50px;z-index: 2;"></div>';
        var _html = '<div class="mapTool">' +
            '<ul id="drawDiv"> ' +
            '<li><a href="javascript:void(0);" id="Region"  title="行政区划" class="admiDivi"></a></li>' +
            '<li><a href="javascript:void(0);" id="Point" title="点" class="point"></a></li>' +
            '<li><a href="javascript:void(0);" id="Polyline" title="线" class="line"></a></li>' +
            '<li><a href="javascript:void(0);" id="Circle" title="圆" class="round"></a></li>' +
            '<li><a href="javascript:void(0);" id="Polygon" title="多边形" class="polygon"></a></li>' +
            '<li><a href="javascript:void(0);" id="full"  title="全屏" class="fullScreen"></a></li>' +
            '<li><a href="javascript:void(0);" id="Clear" title="清除" class="remove"></a></li>' +
            '</ul>' +
            '</div>';
        $("#" + mapDivId).append(_html);
        toolBar = new g_Draw(map);
        toolBar.on("draw-end", addGraphic);
        $("#drawDiv li a").click(function () {
            var tool = $(this).attr("id").toLowerCase();
            if ("clear" == tool) {
                clearMap();
            } else if ("full" == tool) {
                mapFull();
            } else if ("region" == tool) {
                regionClick();
                regionFlag = true;
            } else {
                toolBar.activate(tool);
                regionFlag = false;
            }
        });
    }
    //清空地图
    this.clear = function () {
        clearMap();
    }


    //当在左边的列表中点击时，在地图上标示具体的块
    /**
     *
     * @param disasterId
     * @param peopleDead
     */
    this.select = function (disasterId, peopleDead) {
        var id = disasterId;
        var attr = { "id": id };
        var tmpLayer = map.getLayer("tmpShow");
        var gLa = map.getLayer(layerId);
        tmpLayer.clear();
        hslToRgb(getLastBit(id) * 0.9 + 0.1, 1, 0.2);
        symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([r, g, b, 0.9]), 2), new Color([r, g, b, 0.5]));
        for (var i in gLa.graphics) {
            if (gLa.graphics[i].attributes["id"] == id) {
                //加载至数组
                tmpLayer.add(new Graphic(gLa.graphics[i].geometry, symbol, attr));
            }
        }
    }

    //从map中获取json数据
    this.mapToJson = function () {
        var geos = new Array();
        for (i in map.graphics.graphics) {
            var geo = map.graphics.graphics[i].geometry.toJson();
            geos.push(geo);
        }
        return geos;
    }

    //设置省的数据
    this.setProvinceJsonData = function (data) {
        provinceJsonData = data;
    }

    this.setCityJsonData = function (data) {
        cityJsonData = data;
    }

    this.setCountryJsonData = function (data) {
        countyJsonData = data;
    }

    //设置地图的中心点
    this.setPosition = function (pointX, pointY) {
        var x = parseFloat(pointX);
        var y = parseFloat(pointY);
        timer = setInterval(function () {
            if (map) {
                if ("116.45650486343663" == pointX + "") {
                    map.setZoom(5);
                } else {
                    map.setZoom(6);
                }
                if (x && y)
                    map.centerAt(new g_Point(x, y));
                clearTimeout(timer);
            }
        }, 50);
    }
    //设置地图的缩放等级
    this.setZoom = function (level) {
        map.setZoom(level);
    }

    /**
     * 画地图，传入一个json格式的字符串
     * @param jsonDataString
     */
    this.drawMap = function (jsonDataString) {
        // var gLa = map.getLayer(layerId);
        var geos = JSON.parse(jsonDataString);
        for (i in geos) {
            var geo = g_JsonUtils.fromJson(geos[i]);
            var symbol;
            if (geo.type === "point") {
                symbol = new g_SimpleMarkerSymbol(
                    g_SimpleMarkerSymbol.STYLE_CIRCLE,
                    8, new g_SimpleLineSymbol(
                        g_SimpleLineSymbol.STYLE_SOLID,
                        new g_Color([0, 0, 0, 0.5]),
                        4
                    ),
                    new g_Color([0, 0, 0, 0.9]));
            }
            else if (geo.type === "polyline") {
                symbol = new g_SimpleLineSymbol();
            }
            else {
                symbol = new g_SimpleFillSymbol(g_SimpleFillSymbol.STYLE_SOLID, new g_SimpleLineSymbol(g_SimpleLineSymbol.STYLE_SOLID, new g_Color([0, 0, 255, 0.9]), 2), new g_Color([96, 96, 96, 0.2]));
            }
            // gLa.add(new Graphic(geo, symbol));
            map.graphics.add(new g_Graphic(geo, symbol));
        }
    }
    //行政区弹窗的确定按钮
    this.showAreaMap = function (data) {
        var flagJson = {};
        var level = $("#areaDiv input[name='areaLevel']:checked").val();
        var gLa = map.getLayer("a");
        gLa.clear();
        gLa.on("click", function (evt) {
            if (regionFlag) {
                //获取点击图形几何
                var geometry = evt.graphic.geometry;
                //新建面样式
                var symbol = new g_SimpleFillSymbol(g_SimpleFillSymbol.STYLE_SOLID, new g_SimpleLineSymbol(g_SimpleLineSymbol.STYLE_SOLID, new g_Color([0, 0, 255, 0.9]), 2), new g_Color([96, 96, 96, 0.2]));
                //将几何与已有面合并
                for (i in map.graphics.graphics) {
                    if (map.graphics.graphics[i].geometry.type === "polygon") {
                        var gra = map.graphics.graphics[i];
                        map.graphics.remove(gra);
                        geometry = g_GeometryEngin.union([gra.geometry, geometry]);
                        break;
                    }
                }
                //向地图加载几何图形
                map.graphics.add(new g_Graphic(geometry, symbol));
            }
        });
        for (var i in data) {
            var attr = { "id": data[i].Code, "name": data[i].Name, "value": data[i] };
            symbol = new g_SimpleFillSymbol(g_SimpleFillSymbol.STYLE_SOLID, new g_SimpleLineSymbol(g_SimpleLineSymbol.STYLE_SOLID, new g_Color([0, 0, 0, 0.9]), 1), new g_Color([255, 255, 255, 0.0]));
            var polygon = new g_Polygon(data[i]);
            gLa.add(new g_Graphic(polygon, symbol, attr));
        }
        //map.addLayer(gLa);
        $("#mapRegion").css('display', 'none');
    }
}//end of MapUtils function

MapUtils.map = null;