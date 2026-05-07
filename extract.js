const fs = require('fs');
const pdf = require('pdf-parse');

async function extract() {
  const ppBuffer = fs.readFileSync('./Legal/casanova-ai-privacy-policy.pdf');
  const tosBuffer = fs.readFileSync('./Legal/casanova-ai-terms-of-service.pdf');
  
  const ppData = await pdf(ppBuffer);
  fs.writeFileSync('pp.txt', ppData.text);
  
  const tosData = await pdf(tosBuffer);
  fs.writeFileSync('tos.txt', tosData.text);
}

extract();
