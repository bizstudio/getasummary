import React, { useState, useCallback } from "react";
import { Viewer } from "@react-pdf-viewer/core";
import { Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useDropzone } from 'react-dropzone';
import ChatBox from './ChatBox';
import './FileScreen.css';

const FileScreen = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [pdfText, setPdfText] = useState(''); // Moved inside FileScreen component
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    toolbar: {
      defaultScale: SpecialZoomLevel.PageFit, // set default zoom level
    },
  });

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    setSelectedFile(URL.createObjectURL(file));
  
    const formData = new FormData();
    formData.append('pdfFile', file);
  
    fetch('http://localhost:5000/convert-pdf', {  // ensure this points to your Express server
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Received file from server.`);
      setPdfText(data.text); // Update the PDF text state with the text content of the PDF
    })
    .catch((error) => {
      console.error('Failed to convert PDF to text:', error);
    });
  }, []);
  
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = (event) => {
    event.preventDefault();
  
    // Add the user's message to the chat log
    const newChatLog = [...chatLog, { user: 'user', message: chatInput }];
    setChatLog(newChatLog);
  
    // Send the user's question and the PDF text to the server
    fetch('http://localhost:5000/get-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userQuestion: chatInput,
        pdfText: pdfText // This should be the text content of the PDF
      })
    })
    .then(response => response.json())
    .then(data => {
      // Add the server's response to the chat log
      setChatLog([...newChatLog, { user: 'gpt', message: data.answer }]);
    })
    .catch(error => {
      console.error('Failed to get answer from GPT-3.5 Turbo:', error);
    });
  
    // Clear the chat input
    setChatInput('');
  };
  

  return (
    <div className="fileScreen">
      {selectedFile ? (
        <div className="fileScreen__viewer">
          <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js">
            <Viewer 
              fileUrl={selectedFile} 
              plugins={[defaultLayoutPluginInstance]} 
            />
          </Worker>
          <div className="chatBox">
            <ChatBox chatLog={chatLog} setChatInput={setChatInput} handleSubmit={handleSubmit} chatInput={chatInput} />
          </div>
        </div>
      ) : (
        <div className="dropzone" {...getRootProps()}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop some files here, or click to select files</p>
          }
        </div>
      )}
    </div>
  );
};

export default FileScreen;
