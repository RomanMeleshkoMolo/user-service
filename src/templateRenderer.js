const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

function renderEmailTemplate(confirmationCode) {
  const templatePath = path.join(__dirname, '../Templates/emailTemplate.ejs');
  const template = fs.readFileSync(templatePath, 'utf-8');
  return ejs.render(template, { confirmationCode });
}

module.exports = renderEmailTemplate;
