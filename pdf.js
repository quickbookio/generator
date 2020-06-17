'use strict'

const chromium = require('chrome-aws-lambda');

module.exports.pdf = async (event, context) => {
    // cors check of config doesn't seem to work
    if (event.headers.origin === 'https://quickbook.io') {
        let browser = null;

        await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

        browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                '--enable-font-antialiasing',
                '--font-render-hinting=none',
                '--ppapi-antialiased-text-enabled=1'
            ],
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        await page.setViewport({
            width: 794,
            height: 1123,
            deviceScaleFactor: 1,
        });

        const url = `https://quickbook.io/#/${Buffer.from(event.body, 'base64').toString() || ''}`;

        console.log(url);

        await page.goto(url, {
            waitUntil: [
                'domcontentloaded',
                'networkidle0'
            ]
        });

        await page.waitFor('*');

        await page.waitFor(1000);

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
        });

        browser.close();

        // https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
        // https://www.serverless.com/blog/cors-api-gateway-survival-guide/

        const response = {
            headers: {
                'Access-Control-Allow-Origin': 'https://quickbook.io',
                'Access-Control-Allow-Credentials': false,
                'Content-type': 'application/pdf',
            },
            statusCode: 200,
            body: pdf.toString('base64'),
            isBase64Encoded: true,
        };

        return response;
    }
};
