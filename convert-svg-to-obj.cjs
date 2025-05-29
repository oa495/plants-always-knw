const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function convertSvgsToObject(folderPath) {
    const files = fs.readdirSync(folderPath);
    const imageToSvg = {};

    files.forEach(file => {
        if (path.extname(file) === '.svg') {
            const filePath = path.join(folderPath, file);
            const svgContent = fs.readFileSync(filePath, 'utf-8');
            const $ = cheerio.load(svgContent, { xmlMode: true });

            const pathElement = $('path').first();
            const d = pathElement.attr('d');

            if (d) {
                const name = path.basename(file, '.svg');
                imageToSvg[name] = {
                    type: 'path',
                    d: d,
                    viewbox: $('svg').attr('viewBox') 
                };
            } else {
                console.warn(`No <path> found in ${file}`);
            }
        }
    });

    return imageToSvg;
}

// Example usage:
const folder = './public/svgs'; // Replace with your folder path
const result = convertSvgsToObject(folder);
fs.writeFileSync(
    path.join(folder, 'svgs.json'),
    JSON.stringify(result, null, 2),
    'utf-8'
);
