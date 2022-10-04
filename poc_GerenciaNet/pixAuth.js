require('dotenv').config({ path: '../.env.producao' });

const https = require('https');
const axios = require('axios');
const fs = require('fs');
const { log } = require('console');

const apiProduction = 'https://api-pix.gerencianet.com.br';
const apiHomologacao = 'https://api-pix-h.gerencianet.com.br';

const baseUrl =
  process.env.GN_ENV === 'producao' ? apiProduction : apiHomologacao;

const getGNToken = async () => {
  const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICATE);
  const credentials = {
    client_id: process.env.GN_CLIENT_ID,
    client_secret: process.env.GN_CLIENT_SECRET,
  };
  const data = JSON.stringify({ grant_type: 'client_credentials' });
  const data_credentials =
    credentials.client_id + ':' + credentials.client_secret;

  const auth = Buffer.from(data_credentials).toString('base64');

  const agent = new https.Agent({
    pfx: certificado,
    passphrase: '',
  });

  const config = {
    method: 'POST',
    url: `${baseUrl}/oauth/token`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
    data: data,
  };

  const result = await axios(config);
  return result.data.access_token;
};

const getLocation = async (accesstoken, locId) => {
  try {
    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICATE);

    const agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    const config = {
      method: 'GET',
      url: `${baseUrl}/v2/loc/${locId}/qrcode`,
      headers: {
        Authorization: `Bearer ${accesstoken}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
  
    };

    const result = await axios(config);
    return result.data;
  } catch (e) {
    console.log(e);
  }
};

const createCharge = async (accesstoken, chargeData) => {
  try {
    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICATE);

    const data = JSON.stringify(chargeData);

    const agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    const config = {
      method: 'POST',
      url: `${baseUrl}/v2/cob`,
      headers: {
        Authorization: `Bearer ${accesstoken}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: data,
    };

    const result = await axios(config);
    return result.data;
  } catch (e) {
    console.log(e);
  }
};

const GNAuthorization = async () => {
  const chave = process.env.CHAVE_PIX
  try {
    const access_token = await getGNToken();

    const chargeData = {
      calendario: {
        expiracao: 36000,
      },
      devedor: {
        cpf: '12345678909',
        nome: 'Francisco da Silva',
      },
      valor: {
        original: '123.45',
      },
      chave,
      solicitacaoPagador: 'Informe o número ou identificador do pedido.',
    };

    const newCharge = await createCharge(access_token, chargeData);
    const qrCode = await getLocation(access_token, newCharge.loc.id)
    console.log(qrCode);
  } catch (e) {
    console.log(e);
  }
};
GNAuthorization();
