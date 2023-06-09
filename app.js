const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();


const port = 3000;
app.use(cors());

const getRequest = (url, headers) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers,
      method: 'GET',
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ data, statusCode: res.statusCode });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};
// Endpoint para obtener el listado de los archivos
app.get('/files/list', async (req, res) => {
  try {
    const response = await getRequest('http://echo-serv.tbxnet.com/v1/secret/files', {
      'Authorization': 'Bearer aSuperSecretKey',
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the file list.' });
  }
});
// Endpoint para obtener los datos formateados
app.get('/files/data', async (req, res) => {
  try {
    let files = [];
    const fileName = req.query.fileName;
    if(!fileName){
      const filesResponse = await getRequest('http://echo-serv.tbxnet.com/v1/secret/files', {
        'Authorization': 'Bearer aSuperSecretKey',
      });
      console.log(filesResponse.data);
      files = JSON.parse(filesResponse.data).files;
    }else{
      files.push(fileName);
    }
    const formattedData = [];

    for (const file of files) {
      try {
        const fileResponse = await getRequest(`http://echo-serv.tbxnet.com/v1/secret/file/${file}`, {
          'Authorization': 'Bearer aSuperSecretKey',
        });
        console.log(fileResponse.data);
        const fileData = fileResponse.data.split('\n');
        console.log(fileData);
        const lines = [];

        for (const line of fileData) {
          const lineData = line.split(',');
        
          if (lineData.length === 4) {
            const [file, text, number, hex] = lineData;
        

            if (file && text && number && hex) {
              const validFile = /^[^,]+$/.test(file); // El nombre del archivo no debe contener comas
              const validText = typeof text === 'string'; // El texto debe ser una cadena de caracteres
              const validNumber = !isNaN(number) && Number.isInteger(parseInt(number)); // El número debe ser un entero válido
              const validHex = /^[0-9a-fA-F]{32}$/.test(hex); // El hexadecimal debe tener 32 dígitos hexadecimales
        
              if (validFile && validText && validNumber && validHex) {
                lines.push({ file, text, number: parseInt(number), hex });
              }
            }
          }
        }

        formattedData.push({ file, lines });
      } catch (error) {
        console.error(`Error downloading or processing file '${file}':`, error.message);
      }
    }

    res.json(formattedData);
  } catch (error) {
    console.error('Error retrieving file list:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});

module.exports = app;
