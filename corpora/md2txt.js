/*
 * For converting .md (Markdown) files to .txt (plaintext) for processing
 * purposes. Requires the html-to-text and showdown NPM modules to be installed.
 */

const { htmlToText } = require('html-to-text');
const showdown = require('showdown');
const fs = require('fs');

converter = new showdown.Converter();

// don't uppercase headings
const head_options = { options: { uppercase: false } };
const tag_options = {
  'tags': {
    'h1': head_options,
    'h2': head_options,
    'h3': head_options,
    'h4': head_options,
    'h5': head_options,
    'h6': head_options,
  }
};

const md2html = md => converter.makeHtml(md);
const html2txt = html => htmlToText(html, tag_options);
const md2txt = md => html2txt(md2html(md));

const files = fs.readdirSync('.').filter(filename => filename.endsWith('.md'));
for (const file of files) {
  const md = fs.readFileSync(file, { encoding: 'utf8' });
  fs.writeFileSync(file.split('.').slice(0, -1).join('.') + '.txt',
    md2txt(md));
}
