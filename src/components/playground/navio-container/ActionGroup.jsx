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
const ActionGroup = ({ exportData, data, attributes, resetData, toggleSidebar, networkLoaded, setArcsData, arcsData, setColorAttribute, setNodesLabel, setNodesId }) => {
  const beforeArcsUpload = (e) => {
    const selectOptions= {};
    attributes.forEach((attribute)=>selectOptions[attribute.name]=attribute.name);
    console.log(selectOptions);

    prompt({
    title: 'Node id',
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
    let data = exportData;
    const items = data.slice();
    const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    const blob = new Blob([csv], {type: 'ext/csv;charset=utf-8'});
    FileSaver.saveAs(blob, 'export_data.csv');
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
      <script type="text/javascript" src="https://john-guerra.github.io/Navio/Navio.js"></script>
      <script type="text/javascript">
        let nn = new Navio("#Navio", 600);
        let cat = "categorical"
        let seq = "sequential";
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
    const link = document.getElementById('downloadLink');
    mimeType = mimeType || 'text/plain';
    const filename = 'index.html';
    link.setAttribute('download', filename);
    link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
    // link.click();
    download();
  };
  return (
    <div style={{ textAlign: 'center' }}>
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
        (<div>
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
            <h1 style={{ fontSize: '2em' }}>
              upload links file
            </h1>
            <p className="ant-upl  827 root      20   0 1287436  19684  11340 S   0,3  0,2   0:00.36 snapd
  oad-hint">.json files allowed.</p>
          </div>
        </Dragger>

      </div>
        )
        : ( <br></br>)
      }
      {networkLoaded ?
      (<Row>
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
        <div style={{padding: '10px'}}>Nodes Label attribute:</div>
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
