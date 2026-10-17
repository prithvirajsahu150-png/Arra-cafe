const fs = require('fs');
let content = fs.readFileSync('c:/arra cafe/data/menu.ts', 'utf8');
content = content.replace('price: string;\n  image?: string;', 'price: number;\n  image: string | null;');
content = content.replace(/price: '₹(\d+)'/g, 'price: $1, image: null');
fs.writeFileSync('c:/arra cafe/data/menu.ts', content);
