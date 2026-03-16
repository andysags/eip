const fs = require('fs');
const path = require('path');

const dirPath = __dirname;
const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace assets/css/style.css" with assets/css/style.css?v=2.0"
    content = content.replace(/(href="assets\/css\/[a-zA-Z0-9_-]+\.css)"/g, '$1?v=2.0"');
    
    // Replace assets/js/*.js" with assets/js/*.js?v=2.0"
    content = content.replace(/(src="assets\/js\/[a-zA-Z0-9_-]+\.js)"/g, '$1?v=2.0"');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
