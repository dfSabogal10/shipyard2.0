import React from 'react';
import { connect } from 'react-redux';
import { Row, Col, Select, Button, Icon, Tooltip, Upload, Divider } from 'antd';
import { resetData, toggleSidebar, setArcsData, setColorAttribute, setNodesLabel, setNodesId } from './../../../actions';
import FileSaver from 'file-saver';
import * as vega from 'vega';
import * as d3 from 'd3';
const Dragger = Upload.Dragger;
const prompt= window.require('electron-prompt');



const ButtonGroup = Button.Group;
const Option = Select.Option;
var linksid = '';
const ActionGroup = ({ exportData, data, attributes, resetData, colorAttribute, toggleSidebar, networkLoaded, setArcsData, arcsData, setColorAttribute, setNodesLabel, setNodesId }) => {
  const beforeArcsUpload = (e) => {
    const selectOptions= {};
    attributes.forEach((attribute)=>selectOptions[attribute.name]=attribute.name);
    console.log(selectOptions);

    prompt({
    title: 'Node id',
    height: 150,
    label: 'Select the attribute you want to use as node identificator:',
    value: 'id',
    inputAttrs: {
        type: 'text'
    },
    type: 'select',
    selectOptions: selectOptions,
  })
  .then((r) => {
      if(r === null) {
          console.log('user cancelled');
      } else {
          linksid=r;
          handleArcsFile(e,r);
      }
  })
  .catch(console.error);
  }
  const handleArcsFile = (file, id) => {
    const reader = new window.FileReader();
    if (file == null) {
      return;
    }
    reader.onload = (lEvent) => {
      const format = file.name.split('.').pop().toLowerCase();
      var values;
      try {
        console.log('TRY')
        values = vega.read(lEvent.target.result, {type: format});
        setNodesId(id);
        setArcsData(values);

      } catch (err) {
        console.log('CATCH', err)
        let ssv = d3.dsvFormat(',');
        values = ssv.parse(lEvent.target.result);
        delete values.columns;
        setNodesId(id);
        setArcsData(values);

      }
    };

    reader.readAsText(file);
  }
  const download = () => {

    let datos = [];
    exportData.forEach(function(o){
      let nuevo = JSON.parse(JSON.stringify(o));
      delete nuevo.__i; delete nuevo.x; delete nuevo.y; delete nuevo.vy; delete nuevo.vx;
      datos.push(nuevo);
    });
    const items = datos.slice();
    const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    const blob = new Blob([csv], {type: 'ext/csv;charset=utf-8'});
    FileSaver.saveAs(blob, 'export_data.csv');
    console.log(exportData);
    console.log(datos);
    if(arcsData.length!==0)
    {
      var linksdata= arcsData;
      linksdata = linksdata.map(link =>({source:link.source[linksid], target:link.target[linksid], weight:link.weigth}));
      console.log(linksdata);
      const linksitems = linksdata.slice();
      const linksreplacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
      const linksheader = Object.keys(linksitems[0]);
      let linkscsv = linksitems.map(row => linksheader.map(fieldName => JSON.stringify(row[fieldName], linksreplacer)).join(','));
      linkscsv.unshift(linksheader.join(','));
      linkscsv = linkscsv.join('\r\n');
      const blob = new Blob([linkscsv], {type: 'ext/csv;charset=utf-8'});
      FileSaver.saveAs(blob, 'export_links.csv');
    }
  };

  const handleAttributeColorChange= (value)=> {
    setColorAttribute(value);
  };

  const handleNodeLabelChange=(value)=>{
    setNodesLabel(value);
  }
  const exportVisualization = () => {
    let mimeType = 'text/html';
    let catColumns = [];
    let seqColumns = [];
    attributes.forEach(a => {
      if (a.type === 'categorical') {
        catColumns.push(a.name);
      } else {
        seqColumns.push(a.name);
      }
    })
    const elHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Navio</title>
    </head>
    <body>
      <div id="Navio"></div>

      <script src="https://d3js.org/d3.v4.min.js"></script>
      <script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
      <script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
      <script type="text/javascript" src="https://unpkg.com/navio/dist/navio.min.js"></script>
      <script type="text/javascript">
        let nn = navio(d3.select("#Navio"), 600);
        let cat = "CATEGORICAL"
        let seq = "SEQUENTIAL";
      let attributes = JSON.parse('${JSON.stringify(attributes)}');
        d3.csv("./export_data.csv", function (err, data) {
          if (err) throw err;
        data.forEach((row) => {
          attributes.forEach(att=> {
            if(att.data === "date"){
              let mydate = new Date(row[att.name]);
              if(isNaN(mydate.getDate())){
                row[att.name] = null;
              }else {
                row[att.name] = mydate
              }

            }
            else if(att.data=== "number"){
              let mynumber = +row[att.name];
              if(isNaN(mynumber)){
                row[att.name] = null;
              }else{
                row[att.name] = mynumber;
              }
            }
          })
        })

        attributes.forEach((d,i)=>{
            if(d.checked){
            console.log("------------");

              if(d.type === cat){
                console.log('cat',d.name);
                nn.addCategoricalAttrib(d.name);
              }else if(d.type === seq){
                console.log('seq',d.name);
                if(d.data=== "date"){
                  console.log('date')
                  nn.addSequentialAttrib(d.name,
                            d3.scalePow()
                              .exponent(0.25)
                              .range([d3.interpolatePurples(0), d3.interpolatePurples(1)]))
                }
                else {
                  nn.addSequentialAttrib(d.name);
                }

              }

             console.log("------------");
           }
          })

        nn.data(data);
      });
      </script>
    </body>
    </html>`;
    const elOtroHtml=`<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <link rel="stylesheet" href="css/styles.css?v=1.0">
          <!-- Latest compiled and minified CSS -->
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
          <!-- jQuery library -->
          <title>Navio</title>
        </head>
        <body>
          <div class="container">
            <div class="row">
              <div class="col-md-6">
                <div id="Navio"></div>
              </div>
              <div class="col-md-6">
                <canvas
                style={{ overflowX: 'scroll'}}
                width= '500'
                height= '500'
                id="network"
              ></canvas>
              </div>
            </div>
          </div>

          <script src="https://d3js.org/d3.v4.min.js"></script>
          <script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
          <script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
          <script type="text/javascript" src="https://unpkg.com/navio/dist/navio.min.js"></script>
          <script type="text/javascript">
            let nn = navio(d3.select("#Navio"), 600).updateCallback(updateFilteredData);
            let cat = "CATEGORICAL"
            let seq = "SEQUENTIAL";
            let attributes = JSON.parse('${JSON.stringify(attributes)}');
            d3.csv("./export_data.csv", function (err, data) {
              if (err) throw err;
            data.forEach((row) => {
              attributes.forEach(att=> {
                if(att.data === "date"){
                  let mydate = new Date(row[att.name]);
                  if(isNaN(mydate.getDate())){
                    row[att.name] = null;
                  }else {
                    row[att.name] = mydate
                  }

                }
                else if(att.data=== "number"){
                  let mynumber = +row[att.name];
                  if(isNaN(mynumber)){
                    row[att.name] = null;
                  }else{
                    row[att.name] = mynumber;
                  }
                }
              })
            })

            attributes.forEach((d,i)=>{
                if(d.checked){
                console.log("------------");

                  if(d.type === cat){
                    console.log('cat',d.name);
                    nn.addCategoricalAttrib(d.name);
                  }else if(d.type === seq){
                    console.log('seq',d.name);
                    if(d.data=== "date"){
                      console.log('date')
                      nn.addSequentialAttrib(d.name,
                                d3.scalePow()
                                  .exponent(0.25)
                                  .range([d3.interpolatePurples(0), d3.interpolatePurples(1)]))
                    }
                    else {
                      nn.addSequentialAttrib(d.name);
                    }

                  }

                 console.log("------------");
               }
              })

            nn.data(data);
          });

              const nodecolor='${colorAttribute}';
              const linkidtype='${(linksid ? attributes.find(obj => obj.name ==linksid).data : '' )}';
              const linkid='${(linksid ? linksid: '' )}';
              var linksnuevos,nodes;
              var canvas = d3.select("#network"),
              width = canvas.attr("width"),
              height = canvas.attr("height"),
              ctx = canvas.node().getContext("2d"),
              r = 3,
              color = d3.scaleOrdinal(d3.schemeCategory20),
              simulation = d3.forceSimulation()
                .force("x", d3.forceX(width/2))
                .force("y", d3.forceY(height/2))
                .force("collide", d3.forceCollide(r+1))
                .force("charge", d3.forceManyBody()
                  .strength(-20))
                .force("link", d3.forceLink()
                  .id(function (d) { return d[linkid]; }));
              d3.csv("./export_data.csv", function (err, data) {
                if (err) throw err;
                data.forEach((row) => {
                  attributes.forEach(att=> {
                    if(att.data === "date"){
                      let mydate = new Date(row[att.name]);
                      if(isNaN(mydate.getDate())){
                        row[att.name] = null;
                      }else {
                        row[att.name] = mydate
                      }

                    }
                    else if(att.data=== "number"){
                      let mynumber = +row[att.name];
                      if(isNaN(mynumber)){
                        row[att.name] = null;
                      }else{
                        row[att.name] = mynumber;
                      }
                    }
                  })
                })
                nodes=data;
                simulation.nodes(nodes);
                d3.csv("./export_links.csv", function (err, links) {
                  if (err) throw err;
                  if(linkidtype==='NUMBER'){
                    linksnuevos =links.map(link =>({source: +link.source, target:+link.target, weight:link.weigth}))
                    .filter(link => ((typeof link.source === 'number'||typeof link.source ==='string') && nodes.find(n => n[linkid] == link.source) && nodes.find(n => n[linkid] == link.target))
                    || (typeof link.source === 'object' && nodes.find(n => n[linkid] == link.source[linkid]) && nodes.find(n => n[linkid] == link.target[linkid])));

                  }
                  else{
                    linksnuevos= links.filter(link => ( (typeof link.source === 'number'||typeof link.source ==='string') && nodes.find(n => n[linkid] == link.source) && nodes.find(n => n[linkid] == link.target))
                    || (typeof link.source === 'object' && nodes.find(n => n[linkid] == link.source[linkid]) && nodes.find(n => n[linkid] == link.target[linkid])));
                  }
                   console.log(linksnuevos);
                   simulation.force("link")
                     .links(linksnuevos);
                  });
                simulation.on("tick", update);
                canvas
                    .call(d3.drag()
                        .container(canvas.node())
                        .subject(dragsubject)
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));
                function update() {
                  ctx.clearRect(0, 0, width, height);
                  ctx.beginPath();
                  ctx.globalAlpha = 0.5;
                  ctx.strokeStyle = "#aaa";
                  linksnuevos.forEach(drawLink);
                  ctx.stroke();
                  ctx.globalAlpha = 1.0;
                  nodes.forEach(drawNode);
                }
                function dragsubject() {
                  return simulation.find(d3.event.x, d3.event.y);
                }
              });
              function dragstarted() {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d3.event.subject.fx = d3.event.subject.x;
                d3.event.subject.fy = d3.event.subject.y;
                console.log(d3.event.subject);
              }
              function dragged() {
                d3.event.subject.fx = d3.event.x;
                d3.event.subject.fy = d3.event.y;
              }
              function dragended() {
                if (!d3.event.active) simulation.alphaTarget(0);
                d3.event.subject.fx = null;
                d3.event.subject.fy = null;
              }
              function drawNode(d) {
                ctx.beginPath();
                ctx.fillStyle = color(d[nodecolor]);
                ctx.moveTo(d.x, d.y);
                ctx.arc(d.x, d.y, r, 0, Math.PI*2);
                ctx.fill();
              }
              function drawLink(l) {
                ctx.moveTo(l.source.x, l.source.y);
                ctx.lineTo(l.target.x, l.target.y);
              }
              function updateFilteredData(newdata){
                console.log(newdata);
                nodes=newdata;
                simulation.nodes(nodes);

                d3.csv("./export_links.csv", function (err, links) {
                  if (err) throw err;
                  if(linkidtype==='NUMBER'){
                    linksnuevos =links.map(link =>({source: +link.source, target:+link.target, weight:link.weigth}))
                    .filter(link => ((typeof link.source === 'number'||typeof link.source ==='string') && nodes.find(n => n[linkid] == link.source) && nodes.find(n => n[linkid] == link.target))
                    || (typeof link.source === 'object' && nodes.find(n => n[linkid] == link.source[linkid]) && nodes.find(n => n[linkid] == link.target[linkid])));

                  }
                  else{
                    linksnuevos= links.filter(link => ( (typeof link.source === 'number'||typeof link.source ==='string') && nodes.find(n => n[linkid] == link.source) && nodes.find(n => n[linkid] == link.target))
                    || (typeof link.source === 'object' && nodes.find(n => n[linkid] == link.source[linkid]) && nodes.find(n => n[linkid] == link.target[linkid])));
                  }
                   console.log(linksnuevos);
                   simulation.force("link")
                     .links(linksnuevos);
                  });
                simulation.alpha(1).restart();
              }


          </script>
        </body>
      </html>`;
    const link = document.getElementById('downloadLink');
    mimeType = mimeType || 'text/plain';
    const filename = 'index.html';
    link.setAttribute('download', filename);
    if(!networkLoaded)
    {
      link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
    }
    else{
      link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elOtroHtml));
    }
    // link.click();
    download();
  };
  return (
    <div style={{ textAlign: 'center', alignItems:'center', paddingTop: '50px' }}>
      <ButtonGroup>
        <Tooltip
          placement="bottom"
          title="Show sidebar to hide/show attributes and change their type."
        >
          <Button onClick={toggleSidebar}><Icon type="setting" />Setup Navio</Button>
        </Tooltip>
        <Tooltip
          placement="bottom"
          title="Export the filtered data in csv format."
        >
          <Button onClick={download}><Icon type="table" />Export data</Button>
        </Tooltip>
        <Tooltip
          placement="bottom"
          title="Export an embedded version of the visualization (data.csv + index.html)."
        >
          <Button onClick={exportVisualization}>
            <a href="#" id="downloadLink">
              <Icon type="export" />Export visualization
            </a>
          </Button>
        </Tooltip>
        <Tooltip placement="bottom" title="Choose another dataset.">
          <Button onClick={resetData}><Icon type="swap" />Change dataset</Button>
        </Tooltip>
      </ButtonGroup>

      {networkLoaded && arcsData.length ===0 ?
        (<div style={{alignItems:'center', paddingLeft:'30%', paddingRight: '30%',paddingTop: '1%'}}>
          <Dragger
          style={{ alignItems: 'center', minHeight: '1vh' }}
          accept=".csv,.tsv,.txt, .json"
          beforeUpload={beforeArcsUpload}
          name="networkfile"
        >
          <div className="dragger">
            <p className="ant-upload-drag-icon">
              <Icon type="upload" />
            </p>
            <h1 style={{ fontSize: '1em' }}>
              upload links file
            </h1>
            <p className="ant-upl  827 root      20   0 1287436  19684  11340 S   0,3  0,2   0:00.36 snapd
  oad-hint">.csv files allowed.</p>
          </div>
        </Dragger>

      </div>
        )
        : ( <br></br>)
      }
      {networkLoaded ?
      (<Row style={{paddingTop: '50px'}}>
        <Col span={12}></Col>
      <Col span= {3}>
        <div style={{padding: '10px'}}>Color by attribute:</div>
      </Col>
      <Col span= {3}>

      <Select  defaultValue="" style={{ width: 120 }} onChange={handleAttributeColorChange}>
        <Option value="">None</Option>
        {attributes.filter(function(x) { return x.type === 'CATEGORICAL'}).map(
          (attribute) =>
           <Option value={attribute.name}>{attribute.name}</Option>
        )}
      </Select>
      </Col>
      <Col span= {3}>
        <div style={{padding: '10px'}}>Nodes Label attribute (On hover):</div>
      </Col>

    <Col span= {3}>

    <Select  defaultValue="" style={{ width: 120 }} onChange={handleNodeLabelChange}>
      <Option value="">None</Option>
      {attributes.map(
        (attribute) =>
         <Option value={attribute.name}>{attribute.name}</Option>
      )}
    </Select>
    </Col>

  </Row>
    )
    : ( <br></br>)
    }
    </div>
  );
};

const mapStateToProps = state => ({
  exportData: state.shipyard.exportData,
  data: state.shipyard.data,
  attributes: state.shipyard.attributes,
  networkLoaded: state.ui.networkLoaded,
  arcsData: state.shipyard.arcsData,
  colorAttribute: state.shipyard.colorAttribute,
});

const mapDispatchToProps = dispatch => ({
  resetData: () => dispatch(resetData()),
  toggleSidebar: () => dispatch(toggleSidebar()),
  setArcsData: data => dispatch(setArcsData(data)),
  setColorAttribute: attribute => dispatch(setColorAttribute(attribute)),
  setNodesLabel: attribute => dispatch(setNodesLabel(attribute)),
  setNodesId: id => dispatch(setNodesId(id)),
}

);

export default connect(mapStateToProps, mapDispatchToProps)(ActionGroup);
