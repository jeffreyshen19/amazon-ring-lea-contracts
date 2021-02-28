function drawTimeSeries(e,t,a){let i=10,s=50,n=25,o=50,d=250-i-n,l=document.getElementById("time-series").offsetWidth-o-s,r=d3.select("#time-series").select("svg").attr("width",l+o+s).attr("height",d+i+n).style("display","block").select("g").attr("transform","translate("+o+","+i+")"),c=d3.scaleTime().range([0,l]),u=d3.scaleLinear().range([d,0]);c.domain(t),u.domain(a);let m=d3.line().x(function(e){return c(e.date)}).y(function(e){return u(e.y)});r.select(".line").data([e]).attr("d",m);let h=d3.axisBottom(c).tickFormat(d3.timeFormat("%m/%Y")).ticks(d3.timeMonth.every(6)),g=d3.axisLeft(u);r.select(".xAxis").attr("transform","translate(0,"+d+")").call(h),r.select(".yAxis").call(g),r.select(".yAxisLabel").attr("transform","rotate(-90)").attr("y",0-o).attr("x",0-d/2).attr("dy","1em");let p=d3.bisector(function(e){return e.date}).left,v=d3.select("circle"),f=r.select(".tooltip"),M=d3.timeFormat("%B %Y");r.select("rect").attr("width",l).attr("height",d).on("mouseover",function(){v.attr("visibility","visible"),f.attr("visibility","visible")}).on("mouseout",function(){v.attr("visibility","hidden"),f.attr("visibility","hidden")}).on("mousemove",function(){let t=c.invert(d3.mouse(this)[0]),a=p(e,t,1),i=e[a-1],s=e[a],n=t-i.date>s.date-t?s:i;v.attr("cx",c(n.date)).attr("cy",u(n.y)),f.attr("x",c(n.date)+160>l?c(n.date)-170:c(n.date)+10).attr("y",u(n.y)-25).select(".box").html(`\n          <p class = "heading">${M(n.date)}</p>\n          <p>New Agencies: ${n.y}</p>\n        `)})}function getSummaryStatistics(e,t,a){$("#last-updated").text(`Last Updated ${Math.round((new Date-new Date(e.snapshot.date))/36e5)} Hours Ago`),$("#statistic-lea").text(d3.format(",")(e.snapshot.agencies)),$("#statistic-video-requests").text(d3.format(",")(e.snapshot.videoRequests)),$("#statistic-states").text(Object.keys(t).length),$("#statistic-this-month").text(a)}function getUpdates(e){let t=d3.timeFormat("%m/%d/%Y");d3.select("#updates").selectAll("li").data(e).enter().append("li").html(function(e){return`\n          ${e.text}\n          <p class = "heading">${t(e.date)}</p>\n        `})}function drawMap(e,t,a,i){let s=d3.scaleLinear().domain([0,i?t:a]).range(["#dedede","#1f3a93"]),n=d3.select("#map").select("svg"),o=n.select(".tooltip");const d={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"Washington DC",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};n.selectAll(".path").data(e).style("fill",e=>s(i?e.agencies:e.videoRequests)).on("mouseover",function(){o.attr("visibility","visible")}).on("mouseout",function(){o.attr("visibility","hidden")}).on("mousemove",function(e){let t=d3.mouse(this),a=n.node().getBBox().width;o.attr("x",t[0]+160>a?t[0]-170:t[0]+10).attr("y",t[1]-25).select(".box").html(`\n          <p class = "heading">${d[e.state]}</p>\n          <p>${i?"Agencies":"Video Requests"}: ${i?e.agencies:e.videoRequests}</p>\n        `)}),d3.select("#scale").select(".right").select("p").text(d3.format(",")(i?t:a))}function getTable(e){let t=d3.timeFormat("%m/%d/%Y"),a=d3.format(",");d3.select("#table").select("tbody").selectAll("tr").data(e).enter().append("tr").html(e=>`\n      <td>${e.name}</td>\n      <td>${e.address}</td>\n      <td>${t(e.activeDate)}</td>\n      <td>${a(e.videoRequests)}</td>\n    `)}$.getJSON("https://ring-lea-tracker.herokuapp.com/",function(e){let t={},a={},i=[];e.agencies.forEach(function(e){e.activeDate=new Date(e.activeDate);let s=new Date(e.activeDate.getFullYear(),e.activeDate.getMonth());s in t||(t[s]=0),t[s]+=1;let n=e.address.split(", ")[1];null!=n&&n.length>2&&(n="Minneapolis"==n?"MN":abbrState(n,"abbr")),null!=n&&(n in a||(a[n]={agencies:0,videoRequests:0}),a[n].agencies+=1,a[n].videoRequests+=e.videoRequests),e.activeDate.getFullYear()>=2020&&null==e.deactivateDate&&i.push({date:e.activeDate,text:`${e.name} (${n}) added a contract with Ring`})}),e.snapshot.update.forEach(function(t){t.videoRequests>t.prevVideoRequests&&i.push({date:new Date(e.snapshot.date),text:`${t.name} (${t.address.split(", ")[1]}) requested ${t.videoRequests-t.prevVideoRequests} video${t.videoRequests-t.prevVideoRequests==1?"":"s"}`})}),i=i.sort(function(e,t){return t.date-e.date}).slice(0,4);let s=new Date,n=new Date(s.getFullYear(),s.getMonth()),o=n in t?t[n]:0;t=Object.keys(t).map(function(e){return{date:new Date(e),y:t[e]}}).sort(function(e,t){return e.date-t.date});let d,l=d3.extent(t,function(e){return e.date}),r=[0,d3.max(t,function(e){return e.y})+20],c=0,u=0,m=["AK","HI","AL","AR","AZ","CA","CO","CT","DE","FL","GA","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY","DC"].map(function(e){let t=e in a?a[e].agencies:0,i=e in a?a[e].videoRequests:0;return c=Math.max(c,t),u=Math.max(u,i),{state:e,agencies:t,videoRequests:i}});drawTimeSeries(t,l,r),getSummaryStatistics(e,a,o),getUpdates(i),drawMap(m,c,u,!0),getTable(e.agencies.slice(0,100)),$(window).resize(function(){clearTimeout(d),d=setTimeout(function(){drawTimeSeries(t,l,r)},100)});let h=d3.select("#table").select("div").node().scrollHeight-500,g=100;$("#table > div").scroll(function(){$("#table > div").scrollTop()>=h&&(g+=100,getTable(e.agencies.slice(0,Math.min(g,e.agencies.length))),h=d3.select("#table").select("div").node().scrollHeight-500)}),$("#mapRadioAgencies").click(function(){drawMap(m,c,u,!0)}),$("#mapRadioVideoRequests").click(function(){drawMap(m,c,u,!1)})});