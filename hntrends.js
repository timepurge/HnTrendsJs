var paper;
        var data;
        var paperW=1000;
        var paperH=500;
        var gTLX=50;
        var gTLY=10
        var gWidth=450;
        var gHeight=450;
        var xTo;
        var xFrom;
        var timeInPx=gWidth/285;
        var sortedStories=[];
        var lines={};
        var links={};
        
        var txtunderline;
        
        var tooltipMinW=300;
        var tooltipbg;
        var tooltiplabels = [];
        
       $(document).ready(function(){
           paper = Raphael("canvas", paperW,paperH);
           txtunderline = paper.path("M0 0").attr({"stroke-width": 1}).hide();
           
           var loadingLbl=paper.text(2, 2, "Loading HackerNews Trends...").attr({font: '14px Fontin-Sans, Arial', fill: "#000000","text-anchor": "start"});
           var loadingLblW=loadingLbl.getBBox().width;
           var loadingLblH=loadingLbl.getBBox().height;
           var loadingLblBg= paper.rect(2, 2, loadingLblW+20,loadingLblH+20).attr({fill: "#FFF77C", stroke: "#000000", "stroke-width": 1});
           
          
           var loadingLblBgW=loadingLblBg.getBBox().width;
           var loadingLblBgH=loadingLblBg.getBBox().height;
           
           loadingLblBg.attr({x:(paperW-loadingLblBgW)/2, y:(paperH-loadingLblBgH)/2});
           loadingLbl.attr({x:(paperW-loadingLblW)/2, y:(paperH-loadingLblH)/2 + (loadingLblH/2) }).toFront();
           
           $.getJSON('/hntrend', function(trenddata) {
               data=trenddata;
               loadingLblBg.remove();
               loadingLbl.remove();
               getXRange();
               Xaxis();
               Yaxis();
               var axis = paper.path("M"+getStringPoint(gTLX,gTLY)+"L"+getStringPoint(gTLX,gTLY+gHeight)+"L"+getStringPoint(gTLX+gWidth,gTLY+gHeight)).attr({"stroke-width": 2,"stroke-linejoin": "round"});
                Graphtard();
                toolTip();
            });          
       });
       
       function getXRange(){
                var ln=data.news.headlines.length;
                var cDT=new Date().getTime();
                for (var k=0 ; k<ln; k++){
                    var points=data.news.headlines[k].points;
                    var localDate= stringToLocalDate(points[0].x); 
                    if(localDate.getTime()<cDT){
                        cDT=localDate.getTime();
                    }
                }
                xFrom=new Date(cDT);
                xTo=new Date(xFrom.getTime()+(285*60*1000));
        }
            
        function Graphtard(){
                var ln=data.news.headlines.length;
                for (var k=0 ; k<ln; k++){
                    var url=data.news.headlines[k].url;
                    var title=data.news.headlines[k].title;
                    var source=data.news.headlines[k].source;
                    var color=getFixedColor(data.news.headlines[k].color);
                    
                    
                    var points=data.news.headlines[k].points;
                    var pathString="M";
                    var pln=points.length;
                    var getSubPath=false;
                    for( var j=0; j<pln; j++){
                        var localDate= stringToLocalDate(points[j].x);
                        var rank=points[j].rank;
                        var xposval=dateToPixel(localDate);
                        var yposval=rankToY(rank);
                        var dot = paper.circle(xposval,yposval, 2).attr({fill: "#000000",stroke:"none",opacity:.05});
                        dot.kval=k;
                        dot.index=j;
                        dot.x=xposval;
                        dot.y=yposval;
                        dot.mouseover(function (event){
                            onDotMouseOver(this);
                            onLineMouseOver(lines[this.kval]);
                            var cRank=lines[this.kval].itemrank;
                            if(cRank!=undefined){
                                onTextLinkMouseOver(links[cRank-1]);
                            }
                            showToolTip(this);
                        });
                        dot.mouseout(function (event){
                            onLineMouseOut(lines[this.kval]);
                            var cRank=lines[this.kval].itemrank;
                            if(cRank!=undefined){
                                onTextLinkMouseOut(links[cRank-1]);
                            }
                            hideToolTip(this);
                        });
                        dot.click(function(event){
                            onDotClick(this);
                        });
                        pathString=pathString+getStringPoint(xposval,yposval)+"L";
                    }
                  
                    var line = paper.path(pathString).attr({"stroke-width": 3,"stroke-linejoin": "round","stroke":"#"+color,"opacity":0.15});
                    line.toBack();
                    line.kval=k;
                    line.alpha=0.15;
                    if(isTrendy(points)){
                        line.alpha=1;
                        line.attr({"opacity":1});
                    }
                    lines[k]=line;
                    line.mouseover(function (event){
                        onLineMouseOver(this);
                        if(this.itemrank!=undefined){
                            onTextLinkMouseOver(links[this.itemrank-1]);
                        }
                    });
                    line.mouseout(function (event){
                        onLineMouseOut(this);
                        if(this.itemrank!=undefined){
                            onTextLinkMouseOut(links[this.itemrank-1]);
                        }
                    });
                    line.click(function (event){
                        window.open(data.news.headlines[this.kval].source);
                    });
                    if ( stringToLocalDate(points[points.length - 1].x) >= minRecentTime()){
                        var itemRank=points[points.length - 1].rank;
                        line.itemrank=itemRank;
                        sortedStories[itemRank]=k;                       
                    }
                }
                
                
                for( var c=0 ; c<sortedStories.length-1 ; c++){
                    var txt=data.news.headlines[sortedStories[c+1]].title;
                    
                    var col=getFixedColor(data.news.headlines[sortedStories[c+1]].color);
                    var t = paper.text(gTLX+gWidth+10, rankToY(c+1),c+1+". "+txt).attr({font: "11px Fontin-Sans, Arial","text-anchor": "start",fill: col});
                    t.itemrank=c;
                    links[c]=t;
                    t.mouseover(function (event){
                        onTextLinkMouseOver(this);
                        onLineMouseOver(lines[sortedStories[this.itemrank+1]]);
                    });
                    t.mouseout(function (event){
                        onTextLinkMouseOut(this);
                        onLineMouseOut(lines[sortedStories[this.itemrank+1]]);
                    });
                    t.click(function (event){
                        var kval=sortedStories[this.itemrank+1]
                        window.open(data.news.headlines[kval].url);
                    });
                }
        }
       
       function toolTip(){
            tooltipbg = paper.rect(2, 2, 100, 40).attr({fill: "#FFFBCC", stroke: "#222222", "stroke-width": 1}).hide();
            var txt1 = {font: '14px Fontin-Sans, Arial', fill: "#FF6600","text-anchor": "start"};//14
            var txt2 = {font: '9px Fontin-Sans, Arial', fill: "#777777","text-anchor": "start"};//9
            var txt3 = {font: '12px Fontin-Sans, Arial', fill: "#000000","text-anchor": "start"};//12
            var txt4 = {font: '12px Fontin-Sans, Arial', fill: "#5C4454","text-anchor": "start"};
            var txt5 = {font: '12px Fontin-Sans, Arial', fill: "#003366","text-anchor": "start"};
            tooltiplabels[0] = paper.text(2, 2, "-").attr(txt1).hide();
            tooltiplabels[1] = paper.text(2, 20, "-").attr(txt2).hide();
            tooltiplabels[2] = paper.text(2, 20, "-").attr(txt3).hide();
            tooltiplabels[3] = paper.text(2, 20, "-").attr(txt3).hide();
            tooltiplabels[4] = paper.text(2, 20, "-").attr(txt3).hide();
            tooltiplabels[5] = paper.text(2, 20, "-").attr(txt4).hide();
            tooltiplabels[6] = paper.text(2, 20, "-").attr(txt5).hide();
       }
       function onDotMouseOver(dot){
            dot.node.style.cursor="pointer";
       }
       
       function onDotClick(dot){
            window.open(data.news.headlines[dot.kval].source);
       }
       
       function showToolTip(dot){
            var tooltipOffset=15
            var tooltipXMargin=15;
            var tooltipYMargin=10;
            tooltiplabels[0].attr({text:data.news.headlines[dot.kval].title}).show();
            tooltiplabels[1].attr({text:data.news.headlines[dot.kval].url.substr(0,60)}).show();
            tooltiplabels[2].attr({text:"Rank: "+data.news.headlines[dot.kval].points[dot.index].rank}).show();
            tooltiplabels[3].attr({text:"Comments: "+data.news.headlines[dot.kval].points[dot.index].comments}).show();
            tooltiplabels[4].attr({text:"Points: "+data.news.headlines[dot.kval].points[dot.index].points}).show();
            tooltiplabels[5].attr({text:"as of "+getFormatedDate(stringToLocalDate(data.news.headlines[dot.kval].points[dot.index].x))}).show();
            tooltiplabels[6].attr({text:"Click to view the comments on HackerNews"}).show();
            
            var tooltipW=tooltiplabels[0].getBBox().width +(2*tooltipXMargin);
            if(tooltipW<tooltipMinW){
                tooltipW=tooltipMinW;
            }
            
            var tooltipHeight=tooltipYMargin*2;
            
            for (var i in tooltiplabels){
                tooltipHeight=tooltipHeight+tooltiplabels[i].getBBox().height
            }
            var tooltipx=dot.x+tooltipOffset;
            if(dot.y<= paperH/2){
                var tooltipy=dot.y+tooltipOffset;
            }else{
                tooltipy=dot.y-tooltipOffset-tooltipHeight;
            }
            
            tooltipbg.attr({width:tooltipW,x: tooltipx, y: tooltipy}).show();
            
            tooltiplabels[0].attr({x: tooltipx+tooltipXMargin, y: tooltipy+tooltipYMargin+(tooltiplabels[0].getBBox().height/2)});
            tooltiplabels[1].attr({x: tooltipx+tooltipXMargin, y: (tooltiplabels[0].getBBox().y+tooltiplabels[0].getBBox().height)+5});
            tooltiplabels[2].attr({x: tooltipx+tooltipXMargin, y: (tooltiplabels[1].getBBox().y+tooltiplabels[1].getBBox().height)+10});
            tooltiplabels[3].attr({x: tooltipx+tooltipXMargin, y: (tooltiplabels[2].getBBox().y+tooltiplabels[2].getBBox().height)+10});
            tooltiplabels[4].attr({x: tooltipx+tooltipXMargin, y: (tooltiplabels[3].getBBox().y+tooltiplabels[3].getBBox().height)+10});
            tooltiplabels[5].attr({x: tooltipx+tooltipW-tooltiplabels[5].getBBox().width-tooltipXMargin, y: (tooltiplabels[3].getBBox().y+tooltiplabels[3].getBBox().height)+10});
            tooltiplabels[6].attr({x: tooltipx+tooltipXMargin, y: (tooltiplabels[4].getBBox().y+tooltiplabels[4].getBBox().height)+10});
            
            tooltipbg.attr({height:tooltipHeight});
       }
       
       function hideToolTip(dot){
            tooltipbg.hide();
            for (var i in tooltiplabels){
                tooltiplabels[i].hide();
            }
       }
       
       function Xaxis(){
            var xPos=gTLX;
            for( var i=xFrom; i<=xTo ; i=new Date(i.getTime()+(15*60*1000)) ){
                var timestr=getFormatedDate(i);
                if(timestr.indexOf(":30")!=-1){
                    var ptXpos=Math.floor(xPos);
                    var xlinePath="M"+ptXpos+" "+gTLY+"L"+ptXpos+" "+(gTLY+gHeight);
                    var Xline = paper.path(xlinePath).attr({"stroke-width": 1,"stroke-linejoin": "round","stroke":"#FF0000","opacity":0.25});
                    if(ptXpos!=gTLX){
                        var t = paper.text(ptXpos, (gTLY+gHeight+15), timestr);
                    }
                }
                xPos=xPos+(15*timeInPx);
            }
            var txt = {font: '10px Fontin-Sans, Arial'};
            var xlabel = paper.text(gTLX+(450/2), (gTLY+gHeight+30), "TIME").attr(txt);
        }
        
        function Yaxis(){
            var yPos=gTLY;
            var pointInPx=450/30;
            var t = paper.text(40, yPos,1);
            for(var i=0; i<=30; i+=5){
                var t = paper.text(40, rankToY(i),i);
                yPos=yPos+(pointInPx);
            }
            
            var ylabel = paper.text(10, (gTLY+(gHeight/2)), "RANK");
            ylabel.rotate(-90,true);
        }
       
       function onTextLinkMouseOver(txt){
            var underlinePath="M"+getStringPoint(txt.getBBox().x,txt.getBBox().y+txt.getBBox().height)+"L"+getStringPoint(txt.getBBox().x+txt.getBBox().width,txt.getBBox().y+txt.getBBox().height);
            txtunderline.attr({path: underlinePath,"stroke":"#"+getFixedColor(data.news.headlines[sortedStories[txt.itemrank+1]].color)}).show();
            txt.node.style.cursor="pointer";
       }
       
       function onTextLinkMouseOut(txt){
            txtunderline.hide();
       }
       
       function onLineMouseOver(line){
            line.attr({"stroke-width": 6,"opacity":1});
            
       }
       
       function onLineMouseOut(line){
            line.attr({"stroke-width": 3,"opacity":line.alpha});
            
       }
       
       function getFixedColor(color){
            var colDiff=6-color.length;
            if(colDiff>0){
                for(var clk=0; clk<colDiff; clk++){
                    color="0"+color;
                }
            }
            return color;
        }
       
       function dateToPixel(aDate){
            return Math.floor(gTLX+(((aDate.getTime()-xFrom.getTime())/60000)*timeInPx));
       }
       
       function isTrendy(points){
            if ( stringToLocalDate(points[points.length - 1].x) >= minRecentTime()){
                if (points.length < 10){
					return true;
				}
                if(getRise(points) >=4){
                    return true;
                }
                return false;
            }
            return false;
       }
       
       function minRecentTime(){
            return (xTo.getTime() - (1000 * 60 * 15));
            //return (new Date().getTime() - (1000 * 60 * 15));
       }
       
       function getRise(points){
            return ((points[0].y - points[(points.length - 1)].y));
       }
       
       function rankToY(rankval){
            return Math.floor(gTLY+((450/29)*(rankval-1)));
       }
       
       
       
       function getStringPoint(x,y){
            return x+" "+y;
        }
       
       
        function getFormatedDate(fdate){
            var st;
            var hours=fdate.getHours();
            if(hours<12){
                st="am";
            }else{
                hours=hours-12;
                if(hours==0){
                    hours=12;
                }
                st="pm";
            }
            
            var minutes=fdate.getMinutes();
            if(minutes<10){
                minutes="0"+minutes;
            }
            return hours+":"+minutes+" "+st;
        }
       
       function stringToLocalDate(datestr){
            var dparts=datestr.split(" ");
            var datepart=dparts[0].split("-");
            var timepart=dparts[1].split(":");
            var d= new Date(datepart[0],datepart[1]-1,datepart[2],timepart[0],timepart[1],timepart[2]);
            d.setTime(d.getTime()-((d.getTimezoneOffset() * 60) * 1000));
            return d;
       }