import React from 'react';
import { Upload, Icon, Divider } from 'antd';
import ModalDefault from './ModalDefault';
import { connect } from 'react-redux';
import { toggleLoading, setData, toggleDataLoaded, toggleNetworkDataLoaded, setComponentClasses } from './../../../actions';
import * as vega from 'vega';
import * as d3 from 'd3';

const Dragger = Upload.Dragger;
const Loader = ({ attributes, toggleLoading, setData, toggleDataLoaded,toggleNetworkDataLoaded, setComponentClasses }) => {
  const beforeUpload = (e) => {
    toggleLoading();
    handleFile(e);
  };
  const beforeNetworkUpload = (e) => {
    toggleLoading();
    handleNetworkFile(e);
  }
  const handleFile = (file) => {
    const reader = new window.FileReader();
    if (file == null) {
      return;
    }
    reader.onload = (lEvent) => {
      const format = file.name.split('.').pop().toLowerCase();
      var values;
      try {
        console.log('TRY')
        // if (format === 'txt' || (format !== "csv" && format !== "tsv")) {
        //   throw Error();
        // }
        values = vega.read(lEvent.target.result, {type: format});
        // let csvFormat = d3.dsvFormat(","); should be csvFormat??
        // values = csvFormat.parse(lEvent.target.result);
        setData(values);
        setComponentClasses(Object.keys(values[0]));
        toggleLoading();
        toggleDataLoaded();
      } catch (err) {
        console.log('CATCH', err)
        // const separator = prompt('Write a delimiter for your dataset (e.g: ;)');
        // let ssv = d3.dsvFormat(separator);
        let ssv = d3.dsvFormat(',');
        values = ssv.parse(lEvent.target.result);
        delete values.columns;
        setData(values);
        setComponentClasses(Object.keys(values[0]));
        toggleLoading();
        toggleDataLoaded();
      }
    };

    reader.readAsText(file);
  }
  const handleNetworkFile = (file) => {
    const reader = new window.FileReader();
    if (file == null) {
      return;
    }
    reader.onload = (lEvent) => {
      const format = file.name.split('.').pop().toLowerCase();
      var values;
      try {
        console.log('TRY')
        // if (format === 'txt' || (format !== "csv" && format !== "tsv")) {
        //   throw Error();
        // }
        values = vega.read(lEvent.target.result, {type: format});
        // let csvFormat = d3.dsvFormat(","); should be csvFormat??
        // values = csvFormat.parse(lEvent.target.result);
        setData(values);
        setComponentClasses(Object.keys(values[0]));
        toggleLoading();
        toggleNetworkDataLoaded();
      } catch (err) {
        console.log('CATCH', err)
        // const separator = prompt('Write a delimiter for your dataset (e.g: ;)');
        // let ssv = d3.dsvFormat(separator);
        let ssv = d3.dsvFormat(',');
        values = ssv.parse(lEvent.target.result);
        delete values.columns;
        setData(values);
        setComponentClasses(Object.keys(values[0]));
        toggleLoading();
        toggleNetworkDataLoaded();

      }
    };

    reader.readAsText(file);
  }


  return (
    <div style={{ textAlign: 'center', margin: '1em' }}>
      <Dragger
        style={{ alignItems: 'center', minHeight: '30vh' }}
        accept=".csv,.tsv,.txt"
        beforeUpload={beforeUpload}
        name="file"
      >
        <div className="dragger">
          <p className="ant-upload-drag-icon">
            <Icon type="upload" />
          </p>
          <h1 style={{ fontSize: '2em' }}>
            Click or Drag and drop here to upload your dataset
          </h1>
          <p className="ant-upl  827 root      20   0 1287436  19684  11340 S   0,3  0,2   0:00.36 snapd
oad-hint">*.csv, *.tsv and *.txt files allowed.</p>
        </div>
      </Dragger>
      <div>
        <Divider>
          <p>or you can click below to explore pre-loaded datasets</p>
        </Divider>
      </div>
      <div>
        <ModalDefault />
      </div>
      <Divider>
        <p>Or</p>
      </Divider>
      <Dragger
        style={{ alignItems: 'center', minHeight: '30vh' }}
        accept=".csv,.tsv,.txt"
        beforeUpload={beforeNetworkUpload}
        name="networkfile"
      >
        <div className="dragger">
          <p className="ant-upload-drag-icon">
            <Icon type="upload" />
          </p>
          <h1 style={{ fontSize: '2em' }}>
            Click or Drag and drop here to upload the nodes dataset of your network
          </h1>
          <p className="ant-upl  827 root      20   0 1287436  19684  11340 S   0,3  0,2   0:00.36 snapd
oad-hint">*.csv, *.tsv, and *.txt files allowed.</p>
        </div>
      </Dragger>
    </div>

  );
};

const mapStateToProps = state => ({
  attributes: state.shipyard.attributes,
});

const mapDispatchToPropt = dispatch => ({
  toggleLoading: () => dispatch(toggleLoading()),
  setData: data => dispatch(setData(data)),
  toggleDataLoaded: () => dispatch(toggleDataLoaded()),
  toggleNetworkDataLoaded: () => {console.log("entraaaa");dispatch(toggleNetworkDataLoaded());},
  setComponentClasses: atts => dispatch(setComponentClasses(atts)),
})

export default connect(mapStateToProps, mapDispatchToPropt)(Loader);
