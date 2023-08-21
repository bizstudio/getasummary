require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const cors = require('cors');
const { OpenAIApi } = require('openai');
const openai = new OpenAIApi({ api_key: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());

// Define the path to the build directory
const buildPath = path.join(__dirname, '..', 'GetASummary-React', 'get-a-summary', 'build');

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/convert-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        console.log(`Received file ${req.file.originalname}`);  // Log when the file is received
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await  pdfParse(dataBuffer);
        console.log(`Converted file ${req.file.originalname} to text`);

        res.json({ text: data.text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to convert PDF to text.' });
    } finally {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error(`Failed to delete file ${req.file.path}`);
        });
    }
});

const axios = require('axios');

app.post('/get-answer', express.json(), async (req, res) => {
    const { pdfText, userQuestion } = req.body;
    prompt_content = "You are an expert reading a document, generating output from user asked questions and answering them based on document. \n\n"
    prompt_content += "Report Description:\nThe report s hould contain the following: \n"
    prompt_content += "The output should have concise paragraphs that answer the questions asked by the user. \n"
    prompt_content += "The output should be in the form of a report that is easy to read and understand. \n"
    prompt_content += 'The output should be in the form paragraphs with headings. \n'
    prompt_content += "There should be multiple line gaps between paragraphs \n"
    prompt_content += "The output should have headings i.e. summary, keypoints and overview on separate paragraphs. \n"
    prompt_content += "There must be a heading for each paragraph. \n"
    prompt_content += "The output should be in the form of a report that is easy to read and understand. \n"
    prompt_content += "The output should be in the form of headings and in the key points. \n"
    prompt_content += "The output should have a title, summary, keypoints and overview. \n"
    prompt_content += "No paragraph should be included without heading \n"
    prompt_content += "There should • as bullet point in start of every keypoint \n"

    prompt_message = "\n pdf content: " + pdfText + "\n\n" + prompt_content + "\n\n"

    const messages = [
        {
            "role": "system",
            "content": prompt_message
        },
        {
            "role": "user",
            "content": userQuestion
        }
    ];

    try {
        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo-16k-0613',
            messages,
        }, {
            headers: {
                'Authorization': `Bearer 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`,
                'Content-Type': 'application/json'
            }
        });
        let answer = gptResponse.data.choices[0].message.content.trim();


        let list = answer.split("\n");
        let newAnswer = list.join("<br/>");


        let regexPattern = /([<br/>]([0-9]*[.][ ])|-[ ])/g;
        let replacementPattern = '<br/>● ';

        newAnswer = newAnswer.replace(regexPattern, replacementPattern);

        let newregexPattern = /(([<br/>]*[A-Z][a-z]*[ ]*[A-Z]*[a-z]*[0-9]*):)/g;
        let newreplacementPattern = '<strong>$1</strong>';

        newAnswer = newAnswer.replace(newregexPattern, newreplacementPattern);
        res.json({ newAnswer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get answer.' });
    }
});

console.log(`Serving static files from ${buildPath}`);
app.use(express.static(buildPath));

app.get('*', (req, res) => {
    console.log(`Serving index.html from ${buildPath}`);
    res.sendFile(path.join(buildPath, 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('', express.json(), async (req, res) => {
    return "hello"

});
