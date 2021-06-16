function drawTimeSeries(e,t,a){let i=10,n=50,s=25,o=50,l=250-i-s,d=document.getElementById("time-series").offsetWidth-o-n,r=d3.select("#time-series").select("svg").attr("width",d+o+n).attr("height",l+i+s).style("display","block").select("g").attr("transform","translate("+o+","+i+")"),c=d3.scaleTime().range([0,d]),u=d3.scaleLinear().range([l,0]);c.domain(t),u.domain(a);let m=d3.line().x(function(e){return c(e.date)}).y(function(e){return u(e.y)});r.select(".line").data([e]).attr("d",m);let h=d3.axisBottom(c).tickFormat(d3.timeFormat("%m/%Y")).ticks(d3.timeMonth.every(6)),g=d3.axisLeft(u);r.select(".xAxis").attr("transform","translate(0,"+l+")").call(h),r.select(".yAxis").call(g),r.select(".yAxisLabel").attr("transform","rotate(-90)").attr("y",0-o).attr("x",0-l/2).attr("dy","1em");let p=d3.bisector(function(e){return e.date}).left,f=d3.select("circle"),v=r.select(".tooltip"),M=d3.timeFormat("%B %Y");r.select("rect").attr("width",d).attr("height",l).on("mouseover",function(){f.attr("visibility","visible"),v.attr("visibility","visible")}).on("mouseout",function(){f.attr("visibility","hidden"),v.attr("visibility","hidden")}).on("mousemove",function(){let t=c.invert(d3.mouse(this)[0]),a=p(e,t,1),i=e[a-1],n=e[a],s=t-i.date>n.date-t?n:i;f.attr("cx",c(s.date)).attr("cy",u(s.y)),v.attr("x",c(s.date)+160>d?c(s.date)-170:c(s.date)+10).attr("y",u(s.y)-25).select(".box").html(`\n          <p class = "heading">${M(s.date)}</p>\n          <p>New Agencies: ${s.y}</p>\n        `)})}function getSummaryStatistics(e,t,a){$("#last-updated").text(`Last Updated ${Math.round((new Date-new Date(e.snapshot.date))/36e5)} Hours Ago`),$("#statistic-lea").text(d3.format(",")(e.snapshot.agencies)),$("#statistic-video-requests").text(d3.format(",")(e.snapshot.videoRequests)),$("#statistic-states").text(Object.keys(t).length),$("#statistic-this-month").text(a)}function getUpdates(e){let t=d3.timeFormat("%m/%d/%Y");d3.select("#updates").selectAll("li").data(e).enter().append("li").html(function(e){return`\n          ${e.text}\n          <p class = "heading">${t(e.date)}</p>\n        `})}function drawMap(e,t,a,i){let n=d3.scaleLinear().domain([0,i?t:a]).range(["#dedede","#1f3a93"]),s=d3.select("#map").select("svg"),o=s.select(".tooltip");const l={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"Washington DC",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};s.selectAll(".path").data(e).style("fill",e=>n(i?e.agencies:e.videoRequests)).on("mouseover",function(){o.attr("visibility","visible")}).on("mouseout",function(){o.attr("visibility","hidden")}).on("mousemove",function(e){let t=d3.mouse(this),a=s.node().getBBox().width;o.attr("x",t[0]+160>a?t[0]-170:t[0]+10).attr("y",t[1]-25).select(".box").html(`\n          <p class = "heading">${l[e.state]}</p>\n          <p>${i?"Agencies":"Video Requests"}: ${i?e.agencies:e.videoRequests}</p>\n        `)}),d3.select("#scale").select(".right").select("p").text(d3.format(",")(i?t:a))}function getTable(e){let t=d3.timeFormat("%m/%d/%Y"),a=d3.format(",");d3.select("#table").select("tbody").selectAll("tr").data(e).enter().append("tr").html(e=>`\n      <td><a href = '${e.profile}'>${e.name}</a></td>\n      <td>${e.address}</td>\n      <td>${t(e.activeDate)}</td>\n      <td>${a(e.videoRequests)}</td>\n    `)}$.getJSON("https://ring-lea-tracker.herokuapp.com/",function(e){let t={},a={},i=[];e.agencies.forEach(function(e){e.activeDate=new Date(e.activeDate);let n=new Date(e.activeDate.getFullYear(),e.activeDate.getMonth());n in t||(t[n]=0),t[n]+=1;let s=e.address.split(", ")[1];null!=s&&s.length>2&&(s="Minneapolis"==s?"MN":abbrState(s,"abbr")),null!=s&&(s in a||(a[s]={agencies:0,videoRequests:0}),a[s].agencies+=1,a[s].videoRequests+=e.videoRequests),e.activeDate.getFullYear()>=2020&&null==e.deactivateDate&&i.push({date:e.activeDate,text:`${e.name} (${s}) added a contract with Ring`})}),i=i.sort(function(e,t){return t.date-e.date}).slice(0,4);let n=new Date,s=new Date(n.getFullYear(),n.getMonth()),o=s in t?t[s]:0;t=Object.keys(t).map(function(e){return{date:new Date(e),y:t[e]}}).sort(function(e,t){return e.date-t.date});let l,d=d3.extent(t,function(e){return e.date}),r=[0,d3.max(t,function(e){return e.y})+20],c=0,u=0,m=["AK","HI","AL","AR","AZ","CA","CO","CT","DE","FL","GA","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY","DC"].map(function(e){let t=e in a?a[e].agencies:0,i=e in a?a[e].videoRequests:0;return c=Math.max(c,t),u=Math.max(u,i),{state:e,agencies:t,videoRequests:i}});drawTimeSeries(t,d,r),getSummaryStatistics(e,a,o),getUpdates(i),drawMap(m,c,u,!0),getTable(e.agencies.slice(0,100)),$(window).resize(function(){clearTimeout(l),l=setTimeout(function(){drawTimeSeries(t,d,r)},100)});let h=d3.select("#table").select("div").node().scrollHeight-500,g=100;$("#table > div").scroll(function(){$("#table > div").scrollTop()>=h&&(g+=100,getTable(e.agencies.slice(0,Math.min(g,e.agencies.length))),h=d3.select("#table").select("div").node().scrollHeight-500)}),$("#mapRadioAgencies").click(function(){drawMap(m,c,u,!0)}),$("#mapRadioVideoRequests").click(function(){drawMap(m,c,u,!1)})});