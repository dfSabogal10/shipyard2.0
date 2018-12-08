import React, { Component } from 'react';

import { Row, Col } from 'antd';
import { connect } from 'react-redux';
import * as d3 from '../../../node_modules/d3/build/d3.js';
import Side from './navio-container/sidebar/Sider';
import ActionGroup from './navio-container/ActionGroup';
import NetNavioContainer from './NetNavioContainer';
import { updateAttribute, updateFilteredData } from './../../actions';
import './navio-container/sidebar.css';
import * as d3ScaleChromatic from "d3-scale-chromatic";

var graph = {
  // nodesTest:[
  //   {name:'John', age:35},
  //   {name:'John1', age:35},
  //   {name:'John2', age:35},
  //   {name:'John3', age:35},
  //   {name:'John4', age:35},
  //   {name:'John5', age:35},
  // ],
  // linksTest:[
  //   {source: 'John', target:'John1'},
  //   {source: 'John', target:'John2'},
  //   {source: 'John', target:'John3'},
  //   {source: 'John', target:'John4'},
  //   {source: 'John1', target:'John5'},
  //   {source: 'John5', target:'John3'},
  //   {source: 'John2', target:'John1'},
  // ],
  links:[

  ]
}

const cat = 'CATEGORICAL';
const seq = 'SEQUENTIAL';
const dat = 'DATE';
const ord = 'ORDINAL';
var selected,canvas, ctx, r, width,  height, simulation, color, x, y;
class NodeNetDiagram extends Component {
  constructor(props){
    super(props);
  }
  dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }
   dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }
   dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }
  drawNode(d){
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    if(this.props.colorAttribute!== ""){
      ctx.fillStyle = color(d[this.props.colorAttribute]);
    }
    ctx.moveTo(d.x, d.y);
    if(this.props.nodesLabel && selected===d){
      ctx.arc(d.x,d.y, r*1.2,0, Math.PI*2);
      ctx.fillStyle = '#000000';
      ctx.fillText(selected[this.props.nodesLabel],selected.x+r,selected.y+r);
    }
    else{
      ctx.arc(d.x,d.y, r,0, Math.PI*2);

    }
    ctx.fill();


  }
  drawLink(l) {
    ctx.moveTo(l.source.x, l.source.y);
    ctx.lineTo(l.target.x, l.target.y);
  }
  dragsubject() {
    return simulation.find(d3.event.x, d3.event.y);
  }
  updateCanvas(){
    ctx.clearRect(0,0,width,height);

    ctx.beginPath();
    // ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#aaa";
    graph.links.forEach(this.drawLink);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
    this.props.data.forEach(this.drawNode.bind(this));
  }
  generateLinks(id, attribute){
    for (var row in this.props.data) {
          for (var row2 in this.props.data) {
            var elem1=this.props.data[row];
            var elem2=this.props.data[row2];
            if (elem1[attribute]===elem2[attribute] && row!=row2) {
              graph.links.push({source: elem1[id], target: elem2[id]});
            }
          }
      }
  }
  componentDidMount() {

    let id= this.props.nodesid;
    graph.links= this.props.arcsData,
    graph.nodes= this.props.data,
    canvas = d3.select("#network"),
    width = canvas.attr("width"),
    height = canvas.attr("height"),
    ctx = canvas.node().getContext("2d"),
    r= 5,
    color= d3.scaleOrdinal(d3.schemeCategory20),
    // color = d3.scalePow()
    //   .range([d3ScaleChromatic.interpolatePurples(0), d3ScaleChromatic.interpolatePurples(1)]),

    x= d3.scaleOrdinal().range([200,width-200]),
    y= d3.scaleOrdinal().range([100,height-200]),

    simulation= d3.forceSimulation()
      .force("x", d3.forceX(width/2))
      .force("y", d3.forceY(height/2))
      // .force("x", d3.forceX(function (d) { return x(d[groupingAttribute]); }))
      // .force("y", d3.forceY(function (d) { return y(d[groupingAttribute]); }))
      .force("collide", d3.forceCollide(r+1))
      .force("charge", d3.forceManyBody()
      .strength(-30))
      .on("tick",this.updateCanvas.bind(this))
      .force("link", d3.forceLink()
      .id(function (d) { return d[id]; }));
    // this.generateLinks('id','married');
    simulation.nodes(graph.nodes);


    simulation.force("link")
    .links(graph.links);
    canvas
      .call(d3.drag()
          .container(canvas.node())
          .subject(this.dragsubject)
          .on("start", this.dragstarted)
          .on("drag", this.dragged)
          .on("end", this.dragended));
    canvas
      .on("mousemove", () => {
        // const x=d3.mouse(canvas.node())[0];
        // const y=d3.mouse(canvas.node())[1];
        const x= d3.event.offsetX;
        const y= d3.event.offsetY;
        selected = simulation.find(x,y,r*3);
        this.updateCanvas();

      })
    // graph.nodes.forEach(function(d){
    //   d.x= Math.random()*width
    //   d.y= Math.random()*height
    // });
  }
  componentDidUpdate() {
    let id= this.props.nodesid;
    console.log(this.props.nodesid);
    graph.nodes=this.props.data;
    simulation.nodes(graph.nodes);
    graph.links=[];
    this.props.arcsData.forEach(
      (link) =>
      {
        if( (typeof link.source === 'number' && this.props.data.find(n => n.id == link.source) && this.props.data.find(n => n.id == link.target))
        || (typeof link.source === 'object' && this.props.data.find(n => n.id == link.source.id) && this.props.data.find(n => n.id == link.target.id))
        ){
          graph.links.push(link);
        }
      }
    );

    console.log(graph.links);
    simulation.force("link", d3.forceLink()
    .id(function (d) { return d[id]; }));

    simulation.force("link")
    .links(graph.links);

    this.updateCanvas();

  }
  deleteWidget() {

  }


  render () {

    const { showSidebar, arcsData } = this.props;
    const sidebarStyles = ['sidebar'];
    if (!showSidebar) {sidebarStyles.push('hide')}
    return (
      <div>
        <ActionGroup />
        <Row>
          <Col span={10} className={sidebarStyles.join(' ')}>
            <Side />
          </Col>
          <Col span ={12}>
             <NetNavioContainer/>
          </Col>
           <Col span={showSidebar ? 8 : 12} >
              <canvas
              style={{ overflowX: 'scroll'}}
              width= '500'
              height= '500'
              id="network"
            ></canvas>
          </Col>
        </Row>
     </div>
    );
  }
}

const mapStateToProps = state => ({
  showSidebar: state.ui.showSidebar,
  attributes: state.shipyard.attributes,
  data: state.shipyard.exportData,
  updated: state.shipyard.updated,
  arcsData: state.shipyard.arcsData,
  colorAttribute: state.shipyard.colorAttribute,
  nodesLabel: state.shipyard.nodesLabel,
  nodesid: state.shipyard.nodesid,
});

const mapDispatchToProps = dispatch => ({
  updateAttribute: () => dispatch(updateAttribute()),
  updateFilteredData: data => dispatch(updateFilteredData(data)),
})

export default connect(mapStateToProps, mapDispatchToProps)(NodeNetDiagram);
