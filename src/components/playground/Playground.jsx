import React from 'react';
import { connect } from 'react-redux';
import Loader from './loader/Loader';
import NavioContainer from './navio-container/NavioContainer';
import NodeNetDiagram from './NodeNetDiagram';
import Sample from './sample-data/Sample';


const Playground = ({ dataLoaded, showSidebar, networkLoaded }) => {
    let content;
    if (dataLoaded) {
      content = <div><NavioContainer /><Sample /> </div>
    }
    else if (networkLoaded) {
      content = <NodeNetDiagram />
    }
    else {
      content= <Loader />
    }
    return (
    <div style={{ height: '100%' }}>
        { content }


    </div>
  );
};

const mapStateToProps = state => ({
  dataLoaded: state.ui.dataLoaded,
  showSidebar: state.ui.showSidebar,
  networkLoaded: state.ui.networkLoaded
});

export default connect(mapStateToProps)(Playground);
