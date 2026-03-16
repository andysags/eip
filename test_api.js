const fetch = require('node-fetch');

async function testApi() {
    try {
        const response = await fetch('http://localhost:4000/api/products');
        const data = await response.json();
        console.log('API Status:', response.status);
        console.log('Products Count:', data.length);
        console.log('First Product Name:', data.length > 0 ? data[4].name : 'N/A'); // data[0] is created last due to desc order usually? no, seeding order.
        // My route sorts by created_at desc.
        // My seed inserted them.
        console.log('Products:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testApi();
